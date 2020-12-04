import Slide from './Slide.js'
import Renderer from './CMapJS/Renderer.js';
import * as THREE from './CMapJS/three.module.js';
import {OrbitControls} from './CMapJS/OrbitsControls.js';
import {load_graph} from './CMapJS/IO/Graph_Formats/Graph_IO.js' 
import {load_cmap2, export_cmap2} from './CMapJS/IO/Surface_Formats/CMap2_IO.js' 
import {load_cmap3} from './CMapJS/IO/Volumes_Formats/CMap3_IO.js' 
import {tetrahedron_off, icosahedron_off, cube_off, octahedron_off, cactus_off, cactus_scaffold_off, fertility_off, metatron_off} from './off_files.js';
import {cactus0_mesh, cactus1_mesh, fertility, dinopet, santa, ortho3, cactus, test0_mesh, metatron} from './mesh_files.js';
import {cactus_simplified_cg, cactus_cg} from './cg_files.js';
import {BoundingBox} from './CMapJS/Utils/BoundingBox.js';


let background = new THREE.Color(0xfdf6e3);
let mesh_face_color = new THREE.Color(0x555555);
let mesh_edge_color = new THREE.Color(0x333333);

let mesh_face_alpha_material = new THREE.MeshLambertMaterial({
	color: mesh_face_color,
	side: THREE.FrontSide,
	transparent: true,
	opacity: 0.5
});

let mesh_face_material = new THREE.MeshLambertMaterial({
	color: mesh_face_color,
	side: THREE.DoubleSide,
});

let mesh_edge_material = new THREE.LineBasicMaterial({
	color: mesh_edge_color,
	linewidth: 1,
	polygonOffset: true,
	polygonOffsetFactor: -0.5
});

let cactus_surface = load_cmap2('off', cactus_off);
let cactus_initial_mesh = load_cmap3('mesh', cactus0_mesh);
let cactus_surface_fit_mesh = load_cmap3('mesh', cactus1_mesh);
let cactus_skel = load_graph('cg', cactus_cg);
let cactus_skel_simple = load_graph('cg', cactus_simplified_cg);
let cactus_scaffold = load_cmap2('off', cactus_scaffold_off);
let bb = BoundingBox(cactus_surface.get_attribute(cactus_surface.vertex, "position"))

let axis_x = new THREE.Vector3(1, 0, 0);
let axis_y = new THREE.Vector3(0, 1, 0);
let pos = cactus_surface.get_attribute(cactus_surface.vertex, "position");
cactus_surface.foreach(cactus_surface.vertex, vd => {
	pos[cactus_surface.cell(cactus_surface.vertex, vd)].sub(bb.mid);
	pos[cactus_surface.cell(cactus_surface.vertex, vd)].applyAxisAngle(axis_x,-Math.PI/2);
	pos[cactus_surface.cell(cactus_surface.vertex, vd)].applyAxisAngle(axis_y,-Math.PI/2);
});	

pos = cactus_skel.get_attribute(cactus_skel.vertex, "position");
cactus_skel.foreach(cactus_skel.vertex, vd => {
	pos[cactus_skel.cell(cactus_skel.vertex, vd)].sub(bb.mid);
	pos[cactus_skel.cell(cactus_skel.vertex, vd)].applyAxisAngle(axis_x,-Math.PI/2);
	pos[cactus_skel.cell(cactus_skel.vertex, vd)].applyAxisAngle(axis_y,-Math.PI/2);
});	

pos = cactus_skel_simple.get_attribute(cactus_skel_simple.vertex, "position");
cactus_skel_simple.foreach(cactus_skel_simple.vertex, vd => {
	pos[cactus_skel_simple.cell(cactus_skel_simple.vertex, vd)].sub(bb.mid);
	pos[cactus_skel_simple.cell(cactus_skel_simple.vertex, vd)].applyAxisAngle(axis_x,-Math.PI/2);
	pos[cactus_skel_simple.cell(cactus_skel_simple.vertex, vd)].applyAxisAngle(axis_y,-Math.PI/2);
});	

pos = cactus_initial_mesh.get_attribute(cactus_initial_mesh.vertex, "position");
cactus_initial_mesh.foreach(cactus_initial_mesh.vertex, vd => {
	pos[cactus_initial_mesh.cell(cactus_initial_mesh.vertex, vd)].sub(bb.mid);
	pos[cactus_initial_mesh.cell(cactus_initial_mesh.vertex, vd)].applyAxisAngle(axis_x,-Math.PI/2);
	pos[cactus_initial_mesh.cell(cactus_initial_mesh.vertex, vd)].applyAxisAngle(axis_y,-Math.PI/2);
});	

pos = cactus_scaffold.get_attribute(cactus_scaffold.vertex, "position");
cactus_scaffold.foreach(cactus_scaffold.vertex, vd => {
	pos[cactus_scaffold.cell(cactus_scaffold.vertex, vd)].sub(bb.mid);
	pos[cactus_scaffold.cell(cactus_scaffold.vertex, vd)].applyAxisAngle(axis_x,-Math.PI/2);
	pos[cactus_scaffold.cell(cactus_scaffold.vertex, vd)].applyAxisAngle(axis_y,-Math.PI/2);
});	

pos = cactus_surface_fit_mesh.get_attribute(cactus_surface_fit_mesh.vertex, "position");
cactus_surface_fit_mesh.foreach(cactus_surface_fit_mesh.vertex, vd => {
	pos[cactus_surface_fit_mesh.cell(cactus_surface_fit_mesh.vertex, vd)].sub(bb.mid);
	pos[cactus_surface_fit_mesh.cell(cactus_surface_fit_mesh.vertex, vd)].applyAxisAngle(axis_x,-Math.PI/2);
	pos[cactus_surface_fit_mesh.cell(cactus_surface_fit_mesh.vertex, vd)].applyAxisAngle(axis_y,-Math.PI/2);
});	

export let slide_process_0 = new Slide(
	function(surface, skel, skel_simple){
		this.camera = new THREE.PerspectiveCamera(75, surface.width / surface.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 0.8);

		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, 0.8);
		let pointLight = new THREE.PointLight(0xFFFFFF, 0.8);
		pointLight.position.set(10,8,5);
		ambiantLight.layers.enable(1);
		ambiantLight.layers.enable(2);
		ambiantLight.layers.enable(3);
		pointLight.layers.enable(1);
		pointLight.layers.enable(2);
		pointLight.layers.enable(3);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);



		this.surface_renderer = new Renderer(cactus_surface);
		this.surface_renderer.faces.create({material: mesh_face_material}).add(this.scene);
		this.surface_renderer.edges.create({material: mesh_edge_material}).add(this.scene);

		this.surface_alpha_renderer = new Renderer(cactus_surface);
		this.surface_alpha_renderer.faces.create({layer: 1, material: mesh_face_alpha_material}).add(this.scene);

		this.skel_renderer = new Renderer(cactus_skel);
		this.skel_renderer.edges.create({layer: 2, material: mesh_edge_material}).add(this.scene);
		this.skel_renderer.vertices.create({layer: 2, color: 0x00ff00, size:0.00625}).add(this.scene);


		this.skel_simple_renderer = new Renderer(cactus_skel_simple);
		this.skel_simple_renderer.edges.create({layer: 3, material: mesh_edge_material}).add(this.scene);
		this.skel_simple_renderer.vertices.create({layer: 3, color: 0x00ff00, size:0.025}).add(this.scene);


		this.renderer_surface = new THREE.WebGLRenderer({
			canvas: surface,
			antialias: true,
			alpha: true
		});
		let orbit_controls_surface = new OrbitControls(this.camera, this.renderer_surface.domElement);
		
		this.renderer_skel = new THREE.WebGLRenderer({
			canvas: skel,
			antialias: true,
			alpha: true
		});	
		let orbit_controls_skel = new OrbitControls(this.camera, this.renderer_skel.domElement);
		
		this.renderer_skel_simple = new THREE.WebGLRenderer({
			canvas: skel_simple,
			antialias: true,
			alpha: true
		});	
		let orbit_controls_skel_simple = new OrbitControls(this.camera, this.renderer_skel_simple.domElement);

		this.loop = function(){
			if(this.running){
				// this.camera.disableAll();
				this.camera.layers.enable(0);
				this.renderer_surface.render(this.scene, this.camera);
				this.camera.layers.disable(0);
				this.camera.layers.enable(1);
				this.camera.layers.enable(2);
				this.renderer_skel.render(this.scene, this.camera);
				this.camera.layers.disable(2);
				this.camera.layers.enable(3);
				this.renderer_skel_simple.render(this.scene, this.camera);
				this.camera.layers.disable(3);
				requestAnimationFrame(this.loop.bind(this));
			}
		}

	}
);


export let slide_process_1 = new Slide(
	function(scaffold, initial_mesh, surface_fit_mesh){
		this.camera = new THREE.PerspectiveCamera(75, scaffold.width / scaffold.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 0.8);

		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, 0.8);
		let pointLight = new THREE.PointLight(0xFFFFFF, 0.8);
		pointLight.position.set(10,8,5);
		ambiantLight.layers.enable(1);
		ambiantLight.layers.enable(2);
		// ambiantLight.layers.enable(3);
		pointLight.layers.enable(1);
		pointLight.layers.enable(2);
		// pointLight.layers.enable(3);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);



		this.surface_renderer = new Renderer(cactus_surface);
		this.surface_renderer.faces.create({material: mesh_face_alpha_material}).add(this.scene);

		this.scaffold_renderer = new Renderer(cactus_scaffold);
		this.scaffold_renderer.edges.create({layer: 0, color: 0xFF0000}).add(this.scene);


		this.skel_renderer = new Renderer(cactus_skel_simple);
		this.skel_renderer.edges.create({material: mesh_edge_material}).add(this.scene);
		this.skel_renderer.vertices.create({layer: 1, color: 0x00ff00, size:0.025}).add(this.scene);

		this.initial_mesh_renderer = new Renderer(cactus_initial_mesh);
		this.initial_mesh_renderer.volumes.create({layer: 2, material: mesh_face_material}).add(this.scene);
		this.initial_mesh_renderer.volumes.rescale(0.8);

		this.surface_fit_mesh_renderer = new Renderer(cactus_surface_fit_mesh);
		this.surface_fit_mesh_renderer.volumes.create({layer: 3, material: mesh_face_material}).add(this.scene);
		this.surface_fit_mesh_renderer.volumes.rescale(0.85);


		this.renderer_scaffold = new THREE.WebGLRenderer({
			canvas: scaffold,
			antialias: true,
			alpha: true
		});
		let orbit_controls_scaffold = new OrbitControls(this.camera, this.renderer_scaffold.domElement);
		
		this.renderer_initial_mesh = new THREE.WebGLRenderer({
			canvas: initial_mesh,
			antialias: true,
			alpha: true
		});
		let orbit_controls_initial_mesh = new OrbitControls(this.camera, this.renderer_initial_mesh.domElement);
		
		this.renderer_surface_fit_mesh = new THREE.WebGLRenderer({
			canvas: surface_fit_mesh,
			antialias: true,
			alpha: true
		});
		let orbit_controls_surface_fit_mesh = new OrbitControls(this.camera, this.renderer_surface_fit_mesh.domElement);
		

		// this.renderer_skel = new THREE.WebGLRenderer({
		// 	canvas: skel,
		// 	antialias: true,
		// 	alpha: true
		// });	
		// let orbit_controls_skel = new OrbitControls(this.camera, this.renderer_skel.domElement);
		
		// this.renderer_skel_simple = new THREE.WebGLRenderer({
		// 	canvas: skel_simple,
		// 	antialias: true,
		// 	alpha: true
		// });	
		// let orbit_controls_skel_simple = new OrbitControls(this.camera, this.renderer_skel_simple.domElement);

		this.loop = function(){
			if(this.running){
				this.camera.layers.disableAll();
				this.camera.layers.enable(0);
				this.camera.layers.enable(1);
				this.renderer_scaffold.render(this.scene, this.camera);
				this.camera.layers.disable(1);
				this.camera.layers.enable(2);
				this.renderer_initial_mesh.render(this.scene, this.camera);
				this.camera.layers.disable(2);
				this.camera.layers.enable(3);

				this.renderer_surface_fit_mesh.render(this.scene, this.camera);
				// this.camera.layers.disable(2);
				// this.camera.layers.enable(1);
				// this.camera.layers.enable(2);
				// this.renderer_skel.render(this.scene, this.camera);
				// this.camera.layers.disable(2);
				// this.camera.layers.enable(3);
				// this.renderer_skel_simple.render(this.scene, this.camera);
				// this.camera.layers.disable(3);
				requestAnimationFrame(this.loop.bind(this));
			}
		}

	}
);