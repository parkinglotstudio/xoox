import * as THREE from "three";
import { FOG_MIN, FOG_SIZE, FOG_CELL } from "./terrain";
import type { Game } from "./engine";

export class BattlefieldFog {
  private pixels = new Uint8Array(FOG_SIZE * FOG_SIZE * 4);
  texture = new THREE.DataTexture(this.pixels, FOG_SIZE, FOG_SIZE);
  uniforms = {
    battlefieldFog: { value: this.texture },
    battlefieldFogEnabled: { value: 0 },
  };
  private run = -1;
  private display = new Float32Array(FOG_SIZE * FOG_SIZE * 2);
  constructor() {
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
    this.texture.needsUpdate = true;
  }
  update(game: Game, dt = 1 / 60) {
    this.uniforms.battlefieldFogEnabled.value = game.phase === "menu" ? 0 : 1;
    if (this.run !== game.runId) {
      this.run = game.runId;
      this.display.fill(0);
      this.pixels.fill(0);
    }
    for (let i = 0; i < game.explored.length; i++) {
      for (let c = 0; c < 2; c++) {
        const target = c === 0 ? game.explored[i] : game.visible[i];
        const previous = this.display[i * 2 + c];
        const tau = target > previous ? 0.18 : 0.38;
        const next = target + (previous - target) * Math.exp(-dt / tau);
        this.display[i * 2 + c] = next;
        this.pixels[i * 4 + c] = Math.round(next);
      }
      this.pixels[i * 4 + 3] = 255;
    }
    this.texture.needsUpdate = true;
  }
  // Apply exploration after atmospheric fog and output transforms. Unvisited
  // terrain is true black, including rooftops and emissive effects.
  compile = (shader: {
    uniforms: Record<string, unknown>;
    vertexShader: string;
    fragmentShader: string;
  }) => {
    Object.assign(shader.uniforms, this.uniforms);
    shader.vertexShader = "varying vec2 battlefieldXZ;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <worldpos_vertex>",
      `
      #include <worldpos_vertex>
      vec4 battlefieldPosition = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        battlefieldPosition = instanceMatrix * battlefieldPosition;
      #endif
      battlefieldXZ = (modelMatrix * battlefieldPosition).xz;
    `,
    );
    shader.fragmentShader =
      "varying vec2 battlefieldXZ;\nuniform sampler2D battlefieldFog;\nuniform float battlefieldFogEnabled;\n" +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <fog_fragment>",
      `
      #include <fog_fragment>
      if (battlefieldFogEnabled > 0.5) {
        vec2 battlefieldUV = (battlefieldXZ - vec2(${FOG_MIN.toFixed(1)})) / ${(FOG_SIZE * FOG_CELL).toFixed(1)};
        vec2 texel = vec2(1.0 / ${FOG_SIZE.toFixed(1)});
        vec2 knowledge = texture2D(battlefieldFog, battlefieldUV).rg * 4.0;
        knowledge += texture2D(battlefieldFog, battlefieldUV + texel * vec2(1.,0.)).rg * 2.0;
        knowledge += texture2D(battlefieldFog, battlefieldUV + texel * vec2(-1.,0.)).rg * 2.0;
        knowledge += texture2D(battlefieldFog, battlefieldUV + texel * vec2(0.,1.)).rg * 2.0;
        knowledge += texture2D(battlefieldFog, battlefieldUV + texel * vec2(0.,-1.)).rg * 2.0;
        knowledge += texture2D(battlefieldFog, battlefieldUV + texel * vec2(1.,1.)).rg;
        knowledge += texture2D(battlefieldFog, battlefieldUV + texel * vec2(-1.,1.)).rg;
        knowledge += texture2D(battlefieldFog, battlefieldUV + texel * vec2(1.,-1.)).rg;
        knowledge += texture2D(battlefieldFog, battlefieldUV + texel * vec2(-1.,-1.)).rg;
        knowledge /= 16.0;
        float remembered = smoothstep(0.1, 0.85, knowledge.r) * 0.2;
        float visibility = smoothstep(0.05, 0.95, knowledge.g);
        gl_FragColor.rgb *= mix(remembered, 1.0, visibility);
      }
    `,
    );
  };
  dispose() {
    this.texture.dispose();
  }
}
