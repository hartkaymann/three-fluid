precision highp float;

uniform sampler2D density;
uniform sampler2D velocity;
uniform sampler2D pressure;

uniform vec3 u_size;
uniform vec3 u_resolution;

uniform float u_minThreshold;

varying vec3 v_position;

void main( ) {
    vec3 pos = (v_position + u_size / 2.0) / u_size;
    pos.z = pos.z * -1.0 + 1.0;

    if(pos.x < 0.0 || pos.y < 0.0 || pos.z < 0.0 || pos.x > 1.0 || pos.y > 1.0 || pos.z > 1.0 )    
        discard;

    //gl_FragColor = vec4(pos, .1);
    vec3 d = texture3D(density, pos, u_resolution).xxx;
    vec3 vel = texture3D( velocity, pos, u_resolution ).xyz;

    float alpha = ( d.x <= u_minThreshold ) ? 0.0 : min(max(0.05, d.x), 0.75);    

    vec3 color = mix( vec3( 0.247, 0.369, 0.984 ), vec3( 0.988, 0.275, 0.42 ), length( vel ) * 100.0 );
    gl_FragColor = vec4(color, alpha);
}