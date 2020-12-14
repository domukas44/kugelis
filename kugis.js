// import * as THREE from './node_modules/three/src/Three.js';
import * as THREE from 'https://unpkg.com/three@0.123.0/build/three.module.js';

import { TrackballControls } from 'https://unpkg.com/three@0.123.0/examples/jsm/controls/TrackballControls.js';

import { ConvexGeometry } from 'https://unpkg.com/three@0.123.0/examples/jsm/geometries/ConvexGeometry.js';

const scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 10, 1000);
configureCamera();

var renderer = new THREE.WebGLRenderer({ antialias: true });
configureRenderer();

$("#WebGL-output").append(renderer.domElement);
var trackballControls = new TrackballControls(camera, renderer.domElement);


addPlane();

setUpLight();

var controls = new function() {
    this.R1 = 10;
    this.R2 = 5;
    this.noOfPoints = 100000;
    this.textureScale = 2;
    this.yPosition = 14;
    this.h = 20;
    this.tiksliForma = 0;

    this.figure = function() {
        var options = {
            R1: controls.R1,
            R2: controls.R2,
            noOfPoints: controls.noOfPoints,
            textureScale: controls.textureScale,
            yPosition: controls.yPosition,
            h: controls.h,
            tiksliForma: controls.tiksliForma
        };
        draw(options);
    };
}

var gui = new dat.GUI();
gui.add(controls, 'R1', 1, 20).step(1).onChange(controls.figure);
gui.add(controls, 'R2', 1, 20).step(1).onChange(controls.figure);
gui.add(controls, 'noOfPoints', 100, 1000000).step(1).onChange(controls.figure);
gui.add(controls, 'textureScale', 1, 20).step(1).onChange(controls.figure);
gui.add(controls, 'yPosition', 0, 30).step(1).onChange(controls.figure);
gui.add(controls, 'h', 0, 30).step(1).onChange(controls.figure);
gui.add(controls, 'tiksliForma', 0, 1).step(1).onChange(controls.figure);
controls.figure();

var mesh;

function draw(options) {
    if (mesh) scene.remove(mesh);

    const R2 = options.R2;
    const R1 = options.R1;
    const h = options.h;
    const tiksliForma = options.tiksliForma;
    let points;

    if (tiksliForma>0)
         points = accurateCone(100,R1, R2, h);
    else  points = randomPoints(R1, R2, options.noOfPoints, h);

    let goodConePoints = filter(R1, R2, points,h);

    const geometry = new ConvexGeometry(goodConePoints);

    geometry.faceVertexUvs[0] = [];

    var faces = geometry.faces;

    let u1, u2, u3;
    const s = options.textureScale;
    for (var i = 0; i < faces.length; i++) {
        var v1 = geometry.vertices[faces[i].a],
            v2 = geometry.vertices[faces[i].b],
            v3 = geometry.vertices[faces[i].c];

        u1 = calcU(v1.x, v1.z,s);
        u2 = calcU(v2.x, v2.z,s);
        u3 = calcU(v3.x, v3.z,s);

        //sutvarkau, kad nebutu siules
        if (u1 > 0.9 * s || u2 > 0.9 * s || u3 > 0.9 * s) {
            if (u1 < s * 0.8) u1 += s;
            if (u2 < s * 0.8) u2 += s;
            if (u3 < s * 0.8) u3 += s;
        }

        geometry.faceVertexUvs[0].push([
            new THREE.Vector2(u1, calcV(v1.y, h,R1)),
            new THREE.Vector2(u2, calcV(v2.y, h),R1),
            new THREE.Vector2(u3, calcV(v3.y, h),R1),
        ]);
    }
    geometry.uvsNeedUpdate = true;

    function calcU(x, z,s) {
        let phi = Math.atan2(z, x);
        return ((phi + Math.PI) / (2 * Math.PI)) * s;
    }

    function calcV(y, h) {
        return (y + h/2)/h;
    }

    const texture = new THREE.TextureLoader().load('./chessboard.png');
    texture.wrapS = THREE.RepeatWrapping;
    const material = new THREE.MeshPhongMaterial({ map: texture });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = controls.yPosition;
    mesh.castShadow = true;
    scene.add(mesh);
}

controls.figure();
render();

function render() {
    renderer.render(scene, camera);
    requestAnimationFrame(render);
    trackballControls.update();
}

function randomPoints(R1, R2, n,h) {
    var points = [];
    var v=0.5-Math.atan(h/R1/Math.PI);
    for (let i = 0; i < n; i++) {
        let x = random(-((1-v)*R1 + v*R2),((1-v)*R1 + v*R2));
        let y = random(-(h/2*(2*v-1)),(h/2*(2*v-1)));
        let z = random(-((1-v)*R1 + v*R2),((1-v)*R1 + v*R2));
        points.push(new THREE.Vector3(x, y, z));
    }
    return points;
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function filter(R1, R2, points,h) {
    let filteredPoints = [];
    let m = Math.pow(R1-R2,2)/Math.pow(h,2);
    let d = (h/2)*(R1+R2)/(R1-R2);
    points.forEach(v => {

        if (Math.pow(v.x,2)-m*(Math.pow(v.y-d,2))+Math.pow(v.z,2) <=0 && v.y>=-h/2 && v.y<=h/2) filteredPoints.push(v);
    });
    return filteredPoints;
}

function accurateCone(num, R1, R2, h) {
	var points = [];
	const a = 1 / num;
	for (let u = -1; u < 1; u += a) {
		let phi = Math.PI * u;
		const b = 1 / num;
		for (let v = -1; v < 1; v += b) {
			let x = ((1-v)*R1 + v*R2) * Math.sin(phi);
			let y = h/2*(2*v-1);
			let z = ((1-v)*R1 + v*R2) * Math.cos(phi);
 			points.push(new THREE.Vector3(x, y, z));
 		}
 	}
 	return points;
 }

function configureRenderer() {
    renderer.setClearColor(0xEEEEEE, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

function configureCamera() {
    camera.position.x = -100;
    camera.position.y = 35;
    camera.position.z = -100;
    camera.lookAt(scene.position);
}

function setUpLight() {
    const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
    scene.add(ambientLight);
    var spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.angle = Math.PI / 2 * 0.6;
    spotLight.position.set(-50, 50, -50);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 4096; // default is 512
    spotLight.shadow.mapSize.height = 4096; // default is 512
    scene.add(spotLight);
}












function addPlane() {
    var planeGeometry = new THREE.PlaneGeometry(100, 100);
    var planeMaterial = new THREE.MeshLambertMaterial({ color: 	0x00FF00 });
    planeMaterial.side = THREE.DoubleSide;
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.x = 0
    plane.position.y = 0
    plane.position.z = 0
    scene.add(plane);
}

