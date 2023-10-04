
attribute vec3 position;
attribute vec2 uv;

uniform vec3 size;
uniform vec3 res;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

varying vec2 vUv;
varying vec3 vColor;
varying float vZ;

void main() {
    vUv = uv;
    vColor = position;

    float tileNo = floor(position.z / res.z);
    vZ = (size.z / -2.0) + position.z / size.z;
    vZ = (size.z - position.z + (size.z / -2.0)) / size.z; // what the fuck

    vec3 domainRes = size / res; 
    vec3 tiledPos = vec3(
        position.x,
        position.y,
        position.z
    );

    gl_Position = projectionMatrix * modelViewMatrix * vec4(tiledPos, 1.0);
}