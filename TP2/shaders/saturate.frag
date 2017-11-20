#ifdef GL_ES
precision highp float;
#endif

varying vec4 vFinalColor;
varying vec2 vTextureCoord;

uniform sampler2D uSampler;

uniform bool uUseTexture;

uniform float uTime;
uniform vec4 uColor;

void main() {

	vec4 color = vec4(0.0);

	// Branching should be reduced to a minimal. 
	// When based on a non-changing uniform, it is usually optimized.
	if (uUseTexture) {
	
		vec4 textureColor = texture2D(uSampler, vTextureCoord);
		color = mix(textureColor * vFinalColor, uColor, uTime);
		
	} else color = mix(vFinalColor, uColor, uTime);

	gl_FragColor = color;
}