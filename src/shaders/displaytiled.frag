precision highp float;

uniform sampler2D density;
uniform sampler2D velocity;
uniform sampler2D pressure;

uniform vec3 u_size;
uniform vec3 u_color1;
uniform vec3 u_color2;

uniform float u_minThreshold;

uniform bool u_applyShading;

varying vec3 v_position;

vec3 light = normalize( vec3( 2, -5, 3 ) );

void main( ) {
    vec3 pos = ( v_position + u_size / 2.0 ) / u_size;
    pos.z = pos.z * -1.0 + 1.0;

    if ( pos.x < 0.0 || pos.y < 0.0 || pos.z < 0.0 || pos.x > 1.0 || pos.y > 1.0 || pos.z > 1.0 )
        discard;

    //gl_FragColor = vec4(pos, .1);
    vec3 d = texture3D( density, pos * u_resolution).xxx;
    vec3 vel = texture3D( velocity, pos * u_resolution).xyz;

    bool visible = d.x >= u_minThreshold;
    float alpha = visible ? d.x : 0.0;

    vec3 color = mix( u_color1, u_color2, length( vel ) * 10.0 );

    if ( u_applyShading && visible ) {
        gl_FragColor = vec4( color, alpha );

        pos *= u_resolution;
        mat3 offset = mat3( 1.0 );
        float right = texture3D( density, ( pos + offset[0] ) ).x;
        float left  = texture3D( density, ( pos - offset[0] ) ).x;
        float up    = texture3D( density, ( pos + offset[1] ) ).x;
        float down  = texture3D( density, ( pos - offset[1] ) ).x;
        float back  = texture3D( density, ( pos + offset[2] ) ).x;
        float front = texture3D( density, ( pos - offset[2] ) ).x;

        vec3 gradient = 0.5 * vec3( right - left, up - down, back - front );
        float dot = max( dot( normalize( gradient ), light ), 0.1 );
        color *= dot;
    }

    gl_FragColor = vec4( color, alpha );

}