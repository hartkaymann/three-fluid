#version 300

in vec3 position;
in vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPos;

out vec2 vUv;

void main( ) {
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

    vUv = uv;

    gl_Position = projectionMatrix * mvPosition;
}