#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;

uniform float uTime;
uniform vec3 uColor;
uniform sampler2D uSampler;

void main() {

	vec4 color = texture2D(uSampler, vTextureCoord);

	vec3 texColor = color.rgb;

	vec3 finalColor = mix(texColor, uColor, uTime);

	gl_FragColor = vec4(finalColor, 1.0);
}