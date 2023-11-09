precision highp float;

uniform vec3 res;
uniform sampler2D density;
uniform sampler2D velocity;
uniform sampler2D pressure;

uniform float u_minThreshold;

varying vec2 vUv;
varying vec3 vColor;
varying float vZ;

void main( ) {
    vec2 coords = vec2( ( vZ / res.z ) + ( vUv.x / res.z ), vUv.y );
    
    vec3 d = texture2D( density, coords ).xyz;
    vec3 vel = texture2D( velocity, coords ).xyz;
    vec3 color = mix( vec3( 0.247, 0.369, 0.984 ), vec3( 0.988, 0.275, 0.42 ), length( vel ) * 100.0 );
    //color = texture2D(velocity, coords).xyz;

    float alpha = ( d.x <= u_minThreshold ) ? 0.0 : min(max(0.05, d.x), 0.5);

    gl_FragColor = vec4( color, alpha );
    //gl_FragColor = vec4( texcoord.xyxy );
    // gl_FragColor = vec4(vUv.xy, 0.0, 1.0);
    //gl_FragColor = vec4( 0.0, 0.0, vZ / res.x, 1.0);
    //gl_FragColor = vec4( vec3(vUv.x ), 1.0);
}