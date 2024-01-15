precision mediump float;

uniform sampler2D u_readTexture;

uniform vec3 u_resolution;
uniform vec2 u_textureResolution;

uniform float u_scale;

varying vec2 v_offset;

// Sets color to scaled value of the fragment at the offset position.
void main( ) {
    vec2 pos = ( gl_FragCoord.xy + v_offset ) / u_textureResolution;

    gl_FragColor = vec4( u_scale * texture2D( u_readTexture, pos ).xyz, 1.0 );
}
