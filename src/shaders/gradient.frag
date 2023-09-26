precision highp float;

uniform vec3 res; // grid resolution

uniform float halfrdx;

uniform sampler2D pressure;
uniform sampler2D velocity;

vec4 texture3D( sampler2D texture, vec3 coordinates ) {
    vec2 texcoord = vec2( res.x * coordinates.z + coordinates.x, coordinates.y );
    texcoord.x /= res.x * res.z;
    texcoord.y /= res.y;

    return texture2D( texture, texcoord.xy );
}

void main( ) {
    vec2 uv = gl_FragCoord.xy / res.xy;
    vec3 pos = vec3(
      mod(gl_FragCoord.x, res.x),
      gl_FragCoord.y,
      (gl_FragCoord.x - mod(gl_FragCoord.x, res.x)) / res.x    
    );
    
    vec3 offsetX = vec3(1.0, 0.0, 0.0);
    vec3 offsetY = vec3(0.0, 1.0, 0.0);    

    float right = texture3D(pressure, pos + offsetX).x;
    float left  = texture3D(pressure, pos - offsetX ).x;
    float up    = texture3D(pressure, pos + offsetY ).x;
    float down  = texture3D(pressure, pos - offsetY ).x;

    vec2 center = texture3D(velocity, gl_FragCoord.xyz).xy;
    vec2 gradient = halfrdx * vec2(right - left,  up - down);

    gl_FragColor = vec4(center - gradient, 0.0, 1.0);
}