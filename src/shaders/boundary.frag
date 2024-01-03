precision mediump float;

uniform sampler2D u_readTexture;

uniform vec3 u_resolution;
uniform vec2 u_textureResolution;

uniform float u_scale;

varying vec2 v_offset;

void main( ) {
    vec2 pos = (gl_FragCoord.xy + v_offset) / u_textureResolution;

    gl_FragColor = vec4( u_scale * texture2D( u_readTexture, pos ).xyz, 1.0 );
    
    //gl_FragColor = vec4(pos, 0.0, 1.0);
    // gl_FragColor = vec4(1.0, 0.0, 0.62, 1.0);
}
