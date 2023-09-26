precision highp float;

uniform vec3 res; // grid resolution

uniform float halfrdx;

uniform sampler2D velocity;

// TODO: Move to common.frag
// Texture lookup in staggered grid
vec4 texture3D( sampler2D texture, vec3 coordinates ) {
    vec2 texcoord = vec2( res.x * coordinates.z + coordinates.x, coordinates.y );
    texcoord.x /= res.x * res.z;
    texcoord.y /= res.y;

    return texture2D( texture, texcoord.xy );
}

void main( ) {
    vec3 offsetX = vec3( 1.0, 0.0, 0.0 );
    vec3 offsetY = vec3( 0.0, 1.0, 0.0 );

    float right = texture3D( velocity, gl_FragCoord.xyz + offsetX ).x;
    float left = texture3D( velocity, gl_FragCoord.xyz - offsetX ).x;
    float up = texture3D( velocity, gl_FragCoord.xyz + offsetY ).y;
    float down = texture3D( velocity, gl_FragCoord.xyz - offsetY ).y;

    float divergence = halfrdx * ( ( right - left ) + ( up - down ) );
    gl_FragColor = vec4( divergence, 0.0, 0.0, 1.0 );
    //gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
}