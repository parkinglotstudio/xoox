import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// All voxels belonging to one actor share an ID. Edges are extracted from the
// projected ID image, never from geometry normals or individual cube edges.
export default function Silhouette() {
  const { gl, size } = useThree();
  const dpr = useThree((state) => state.viewport.dpr);
  const pass = useMemo(() => {
    const main = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
    });
    main.depthTexture = new THREE.DepthTexture(1, 1);
    const mask = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    });
    mask.depthTexture = new THREE.DepthTexture(1, 1);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        sceneColor: { value: main.texture },
        sceneDepth: { value: main.depthTexture },
        actorMask: { value: mask.texture },
        actorDepth: { value: mask.depthTexture },
        texel: { value: new THREE.Vector2() },
        stroke: { value: 1.5 },
      },
      vertexShader: `varying vec2 uvScreen; void main() {
        uvScreen = uv; gl_Position = vec4(position.xy, 0., 1.);
      }`,
      fragmentShader: `
        varying vec2 uvScreen;
        uniform sampler2D sceneColor, sceneDepth, actorMask, actorDepth;
        uniform vec2 texel;
        uniform float stroke;
        float sameID(vec3 a, vec3 b) { return step(length(a.rg-b.rg), 0.001); }
        void main() {
          vec3 source = texture2D(sceneColor, uvScreen).rgb;
          vec3 actor = texture2D(actorMask, uvScreen).rgb;
          float edge = 0.;
          if (actor.b > 0.001) {
            for(int y=-1; y<=1; y++) for(int x=-1; x<=1; x++) {
              if(x==0 && y==0) continue;
              vec3 neighbor = texture2D(actorMask, uvScreen+vec2(float(x),float(y))*texel*stroke).rgb;
              edge = max(edge, 1.-sameID(actor, neighbor));
            }
            // Compare complete actor depth to the opaque scene depth at this
            // fragment. Visible and self-occluded voxel seams never get a line.
            float hidden = step(texture2D(sceneDepth,uvScreen).r+0.00008,
                                texture2D(actorDepth,uvScreen).r);
            float category = floor(actor.b*255.+0.5);
            vec3 ink = category < 1.5 ? vec3(.27,.72,.63) :
                       category < 2.5 ? vec3(.86,.43,.18) : vec3(.85,.66,.29);
            source = mix(source,ink,edge*hidden*.95);
          }
          gl_FragColor = vec4(source,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      depthTest: false,
      depthWrite: false,
    });
    const scene = new THREE.Scene();
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);
    return { main, mask, material, scene, camera: new THREE.Camera(), quad };
  }, []);
  useEffect(() => {
    const w = Math.max(1, Math.floor(size.width * dpr)),
      h = Math.max(1, Math.floor(size.height * dpr));
    pass.main.setSize(w, h);
    pass.mask.setSize(w, h);
    pass.material.uniforms.texel.value.set(1 / w, 1 / h);
    pass.material.uniforms.stroke.value = 1.5 * dpr;
  }, [gl, dpr, size.width, size.height, pass]);
  useEffect(
    () => () => {
      pass.main.depthTexture?.dispose();
      pass.mask.depthTexture?.dispose();
      pass.main.dispose();
      pass.mask.dispose();
      pass.material.dispose();
      pass.quad.geometry.dispose();
    },
    [pass],
  );
  useFrame(({ scene, camera }) => {
    const previousTarget = gl.getRenderTarget();
    const background = scene.background,
      layer = camera.layers.mask;
    const clear = gl.getClearColor(new THREE.Color()),
      alpha = gl.getClearAlpha();
    const shadowUpdate = gl.shadowMap.autoUpdate;
    camera.layers.set(0);
    gl.setRenderTarget(pass.main);
    gl.clear();
    gl.render(scene, camera);
    // No fog or lighting in the actor ID image. Scene objects stay in layer 0.
    camera.layers.set(1);
    scene.background = null;
    gl.shadowMap.autoUpdate = false;
    gl.setClearColor(0x000000, 1);
    gl.setRenderTarget(pass.mask);
    gl.clear();
    gl.render(scene, camera);
    camera.layers.mask = layer;
    scene.background = background;
    gl.shadowMap.autoUpdate = shadowUpdate;
    gl.setClearColor(clear, alpha);
    gl.setRenderTarget(previousTarget);
    gl.clear();
    gl.render(pass.scene, pass.camera);
  }, 1);
  return null;
}
