function run(color, xDiff, id) {
  const width = 320 * 2;
  const height = 180 * 2;

  var postScene, postCamera;
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(75, width/height, 10, 100);

  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xaaaaaa));
  var directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.x = -20;
  directionalLight.position.y = -20;
  directionalLight.position.z = -20;
  scene.add( directionalLight );

  // var geometry = new THREE.BoxGeometry(1, 1, 1);
  var geometry = new THREE.TorusKnotBufferGeometry( 10, 3, 100, 16 );
  var material = new THREE.MeshLambertMaterial({color: color});
  var cube = new THREE.Mesh(geometry, material);
  cube.position.x += xDiff;
  scene.add(cube);

  camera.position.z = 35;

  const cvs = document.createElement('canvas');
  cvs.width = width;
  cvs.height = height;
  cvs.style.width = `${width}px`;
  cvs.style.height = `${height}px`;
  const coolGfx = cvs.getContext('2d');

  window.requestAnimationFrame(function animate() {
    cube.rotation.x += 0.01 * xDiff / 3;
    cube.rotation.y += 0.01 * xDiff / 3;
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);

    renderer.setRenderTarget(coolerTarget);
    renderer.render(postScene, postCamera);
    readDepthData();
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);
  });

  const buf = new ArrayBuffer(width * height * 4);
  function readDepthData() {
    const array = new Uint8Array(buf);
    renderer.readRenderTargetPixels(renderer.getRenderTarget(), 0, 0, width, height, array);
    const pix = new Uint32Array(buf);
    for (let y = 0; y < height / 2; y++) {
      for (let x = 0; x < width; x++) {
        let t = pix[y * width + x]
        pix[y * width + x] = pix[(height - 1 - y) * width + x];
        pix[(height - 1 - y) * width + x] = t;
      }
    }
    coolGfx.putImageData(new ImageData(new Uint8ClampedArray(buf), width, height), 0, 0);
    let url = cvs.toDataURL('image/png');
    if (parent) {
      parent.postMessage({id: id, mask: url}, '*');
    }
  }

  const coolerTarget = new THREE.WebGLRenderTarget(width, height);
  // Rendering depth from THREE's depth texture example
  const target = new THREE.WebGLRenderTarget(width, height);
  target.texture.format = THREE.RGBFormat;
  target.texture.minFilter = THREE.NearestFilter;
  target.texture.magFilter = THREE.NearestFilter;
  target.texture.generateMipmaps = false;
  target.stencilBuffer = false;
  target.depthBuffer = true;
  target.depthTexture = new THREE.DepthTexture();
  target.depthTexture.type = THREE.UnsignedShortType;
  setupPost();

  function setupPost() {
    // Setup post processing stage
    postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    var postMaterial = new THREE.ShaderMaterial({
      vertexShader: document.querySelector('#post-vert').textContent.trim(),
      fragmentShader: document.querySelector('#post-frag').textContent.trim(),
      uniforms: {
        cameraNear: {value: camera.near},
        cameraFar: {value: camera.far},
        tDepth: {value: target.depthTexture}
      }
    });
    var postPlane = new THREE.PlaneBufferGeometry(2, 2);
    var postQuad = new THREE.Mesh(postPlane, postMaterial);
    postScene = new THREE.Scene();
    postScene.add(postQuad);
  }
}
