import { mat4 } from "gl-matrix";

let rotation = 0;

const vertexShaderSource = `
attribute vec4 position;
attribute vec4 vertexColor;

uniform mat4 modelView;
uniform mat4 projection;

varying lowp vec4 color;

void main(void) {
  gl_Position = projection * modelView * position;
  color = vertexColor;
}
`;

const fragmentShaderSource = `
varying lowp vec4 color;

void main(void) {
  gl_FragColor = color;
}
`;

const positions = [
  -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0,
  -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, 1.0, -1.0, -1.0,
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, -1.0,
  1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
  1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0,
  1.0, -1.0,
];

const indices = [
  0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
  15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
];

const faceColors = [
  [1.0, 1.0, 1.0, 1.0],
  [1.0, 0.0, 0.0, 1.0],
  [0.0, 1.0, 0.0, 1.0],
  [0.0, 0.0, 1.0, 1.0],
  [1.0, 1.0, 0.0, 1.0],
  [1.0, 0.0, 1.0, 1.0],
];

const vertexColors = faceColors.flatMap((_) => [..._, ..._, ..._, ..._]);

start();

function start() {
  const canvas = document.querySelector<HTMLCanvasElement>("canvas");
  const gl: WebGLRenderingContext = canvas.getContext("webgl");

  if (!gl) return;

  function loadShader(type: number, source: string) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log("Compilation failed", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return;
    }

    return shader;
  }

  const vertexShader = loadShader(gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vertexShader || !fragmentShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log("Link failure", gl.getProgramInfoLog(program));
    return;
  }

  const positionAttribute = gl.getAttribLocation(program, "position");
  const vertexColorAttribute = gl.getAttribLocation(program, "vertexColor");
  const projectionUniform = gl.getUniformLocation(program, "projection");
  const modelViewUniform = gl.getUniformLocation(program, "modelView");

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertexColors),
    gl.STATIC_DRAW
  );

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  let last = performance.now();

  function render() {
    const now = performance.now();
    const deltaTime = (now - last) / 1000;
    last = now;

    rotation += deltaTime;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const { clientWidth: width, clientHeight: height } = gl.canvas;
    const projection = mat4.create();
    mat4.perspective(
      projection,
      (45 * Math.PI) / 180,
      width / height,
      0.1,
      100.0
    );

    const modelView = mat4.create();
    mat4.translate(modelView, modelView, [-0.0, 0.0, -6.0]);
    mat4.rotate(modelView, modelView, rotation, [0, 0, 1]);
    mat4.rotate(modelView, modelView, rotation * 0.7, [0, 1, 0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexColorAttribute);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.useProgram(program);
    gl.uniformMatrix4fv(projectionUniform, false, projection);
    gl.uniformMatrix4fv(modelViewUniform, false, modelView);

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
  }

  render();
}
