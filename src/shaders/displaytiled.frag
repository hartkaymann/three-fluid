precision mediump float;

uniform sampler2D density;
uniform sampler2D velocity;
uniform sampler2D pressure;

uniform vec3 u_size;
uniform vec3 u_color1;
uniform vec3 u_color2;

uniform float u_minThreshold;
uniform float u_ambient;

uniform bool u_applyShading;

varying vec3 v_position;
varying vec3 v_cameraPos;

vec3 light = normalize( vec3( 2, -5, 3 ) );

vec3 gradient( vec3 coords ) {
    mat3 offset = mat3( 1.0 );

    float right = texture3D( density, ( coords + offset[0] ) ).x;
    float left = texture3D( density, ( coords - offset[0] ) ).x;
    float up = texture3D( density, ( coords + offset[1] ) ).x;
    float down = texture3D( density, ( coords - offset[1] ) ).x;
    float back = texture3D( density, ( coords + offset[2] ) ).x;
    float front = texture3D( density, ( coords - offset[2] ) ).x;

    return 0.5 * vec3( right - left, up - down, back - front );
}

bool border( vec3 coords ) {
    float dist = 0.05;
    return ( ( coords.x >= 0.0 && coords.x <= dist ) ||
        ( coords.y >= 0.0 && coords.y <= dist ) ||
        ( coords.z >= 0.0 && coords.z <= dist ) ||
        ( coords.x <= u_resolution.x && coords.x >= ( u_resolution.x - dist ) ) ||
        ( coords.y <= u_resolution.y && coords.y >= ( u_resolution.y - dist ) ) ||
        ( coords.z <= u_resolution.z && coords.z >= ( u_resolution.z - dist ) ) );
}

void main( ) {
    vec3 pos = ( v_position + u_size / 2.0 ) / u_size;
    pos.z = pos.z * -1.0 + 1.0;

    if ( pos.x < 0.0 || pos.y < 0.0 || pos.z < 0.0 || pos.x > 1.0 || pos.y > 1.0 || pos.z > 1.0 )
        discard;

    pos *= u_resolution;
    vec3 d = texture3D( density, pos ).xxx;
    vec3 vel = texture3D( velocity, pos ).xyz;

    bool visible = d.x >= u_minThreshold;
    float alpha = visible ? min( d.x, 1.0 ) : 0.0;

    vec3 color = mix( u_color1, u_color2, length( vel ) * u_resolution );

    if ( u_applyShading && visible ) {
        gl_FragColor = vec4( color, alpha );

        vec3 grad = gradient( pos );
        float dot = max( dot( normalize( grad ), normalize( light ) ), 0.0 );
        color *= dot + vec3( u_ambient );
    }

    gl_FragColor = vec4( color , alpha );
    // if ( border( pos ) )
    //     gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );

}