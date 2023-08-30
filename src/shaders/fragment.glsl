uniform vec2 res; // width and height of screen
uniform sampler2D bufferTexture;

void main() {
    vec2 pixel = gl_FragCoord.xy / res.xy;
    //gl_FragColor = texture2D(bufferTexture, pixel);
    //gl_FragColor.r += 0.1;
    gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}