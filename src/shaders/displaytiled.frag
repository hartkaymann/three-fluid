precision highp float;

uniform vec3 res;
uniform sampler2D read;

varying vec2 vUv;
varying vec3 vColor;
varying float vZ;

void main( ) {
    float threshold = 0.01;

    vec3 color = texture2D(read, vec2(vZ + (vUv.x / res.x), vUv.y)).xyz;
    
    float alpha = ( length( color ) < threshold ) ? 0.0 : max( color.x, max( color.y, color.z ) );
    gl_FragColor = vec4( abs(color.xxx), alpha * alpha);
    //gl_FragColor = vec4( texcoord.xyxy );
    // gl_FragColor = vec4(vUv.xy, 0.0, 1.0);
    // gl_FragColor = vec4( 0.0, 0.0, vZ, 1.0);
}