precision highp float;

uniform sampler2D density;
uniform sampler2D velocity;
uniform sampler2D pressure;

uniform vec3 u_resolution;
uniform vec3 u_textureResolution;
uniform vec3 u_tileCount;

uniform float u_minThreshold;

varying vec2 vUv;
varying vec3 vColor;
varying float vZ;

void main( ) {
    float epsilon = 0.000;
    vec2 coords = vec2(
        (mod(vZ + epsilon, u_tileCount.x) + vUv.x) * u_resolution.x / u_textureResolution.x,
        (floor((vZ + epsilon) / u_tileCount.x) + vUv.y) * u_resolution.y / u_textureResolution.y
    );

    vec3 d = texture2D( density, coords ).xyz;
    vec3 vel = texture2D( velocity, coords ).xyz;
    vec3 color = mix( vec3( 0.247, 0.369, 0.984 ), vec3( 0.988, 0.275, 0.42 ), length( vel ) * 100.0 );
    //color = texture2D(velocity, coords).xyz;

    float alpha = ( d.x <= u_minThreshold ) ? 0.0 : min(max(0.05, d.x), 0.75);
    gl_FragColor = vec4( color, alpha );

    // Display velocity instead
    // vec3 v = texture2D(velocity, coords).xyz;
    // alpha = length(v) >= 0.001 ? 0.1 : 0.0;
    // gl_FragColor = vec4(0.5 + u_resolution * v, alpha);

    //gl_FragColor = vec4(d, alpha);
    //gl_FragColor = vec4(coords.y, 0.0, 0.0, 1.0);
    //gl_FragColor = vec4( 0.0, 0.0, vZ / res.x, 1.0);
    //gl_FragColor = vec4( vUv.xy, 0.0 , 1.0);
}