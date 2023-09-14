precision highp float;

uniform sampler2D read;

uniform vec3 bias;
uniform vec3 scale;

varying vec2 texcoord;

void main( ) {
    float threshold = 0.1;

    vec3 color = bias + scale * texture2D( read, texcoord ).xyz;

    float alpha = (length( color ) < threshold) ? 0.0 : max(color.x, max(color.y, color.z));
    gl_FragColor = vec4( color, 1.0 );
    //gl_FragColor = vec4( texcoord.xyxy );
}