#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;

uniform float uTime;
uniform sampler2D uSampler;

void main() {

	vec4 color = texture2D(uSampler, vTextureCoord);

	vec3 texColor = color.rgb;
	vec3 testColor = vec3(1, 0, 0);
	
	vec3 finalColor = mix(texColor, testColor, uTime);

	gl_FragColor = vec4(finalColor, 1.0);
}