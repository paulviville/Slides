import Slide from './Slide.js'
import Renderer from './CMapJS/Renderer.js';
import * as THREE from './CMapJS/three.module.js';
import {OrbitControls} from './CMapJS/OrbitsControls.js';
import {load_graph} from './CMapJS/IO/Graph_Formats/Graph_IO.js' 
import {load_cmap2, export_cmap2} from './CMapJS/IO/Surface_Formats/CMap2_IO.js' 
import {load_cmap3} from './CMapJS/IO/Volumes_Formats/CMap3_IO.js' 
import {cactus_off, cactus_scaffold_off, fertility_off, fertility_scaffold_off} from './Files/off_files.js';
import {cactus_simplified_cg, cactus_cg, fertility_simplified_cg, fertility_cg} from './Files/cg_files.js';
import {fertility_mesh} from './Files/fertility_files.js';
import {cactus0_mesh, cactus1_mesh, cactus_mesh} from './Files/cactus_files.js';
import {BoundingBox} from './CMapJS/Utils/BoundingBox.js';
import compute_scaled_jacobian from './CMapJS/Modeling/Quality/Scaled_Jacobians.js'
import {Clock} from './CMapJS/three.module.js'

let background = new THREE.Color(0xfdf6e3);
let mesh_face_color = new THREE.Color(0x60c3f4);
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

let ambiant_light_int = 0.4;
let point_light_int = 0.6;

let cactus_surface = load_cmap2('off', cactus_off);
let cactus_initial_mesh = load_cmap3('mesh', cactus0_mesh);
let cactus_surface_fit_mesh = load_cmap3('mesh', cactus1_mesh);
let cactus_opt_mesh = load_cmap3('mesh', cactus_mesh);
let cactus_skel = load_graph('cg', cactus_cg);
let cactus_skel_simple = load_graph('cg', cactus_simplified_cg);
let cactus_scaffold = load_cmap2('off', cactus_scaffold_off);
let fertility_surface = load_cmap2('off', fertility_off);
let fertility_skel = load_graph('cg', fertility_cg);
let fertility_simplified_skel = load_graph('cg', fertility_simplified_cg);
let fertility_scaffold = load_cmap2('off', fertility_scaffold_off);
let fertility_vol = load_cmap3('mesh', fertility_mesh);

cactus_opt_mesh.set_embeddings(cactus_opt_mesh.vertex2);
cactus_opt_mesh.debug();
cactus_opt_mesh.set_embeddings(cactus_opt_mesh.volume);
let scaled_jacobian = compute_scaled_jacobian(cactus_opt_mesh);

console.log(scaled_jacobian)
let sj, avg_sj = 0, min_sj = Infinity, nb = 0;
cactus_opt_mesh.foreach(cactus_opt_mesh.volume, wd => {
	if(cactus_opt_mesh.is_boundary(wd))
		return;
	sj = scaled_jacobian[cactus_opt_mesh.cell(cactus_opt_mesh.volume, wd)];
	avg_sj += sj;
	++nb;
	min_sj = min_sj > sj ? sj : min_sj;
});
console.log(avg_sj / nb, min_sj)
let bb = BoundingBox(fertility_simplified_skel.get_attribute(fertility_simplified_skel.vertex, "position"))
console.log(bb)
export let slide_overview = new Slide(
	function(input, output)
	{
		this.camera = new THREE.PerspectiveCamera(75, input.width / input.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 0.8);

		this.scene = new THREE.Scene()
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		let pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,5);
		ambiantLight.layers.enable(1);
		pointLight.layers.enable(1);
		
		this.scene.add(pointLight);
		this.scene.add(ambiantLight);

		this.renderer_input = new THREE.WebGLRenderer({
			canvas: input,
			antialias: true,
			alpha: true
		});	
		let orbit_controls_input = new OrbitControls(this.camera, this.renderer_input.domElement);

		this.renderer_output = new THREE.WebGLRenderer({
			canvas: output,
			antialias: true,
			alpha: true
		});	
		let orbit_controls_output = new OrbitControls(this.camera, this.renderer_output.domElement);

		this.group = new THREE.Group;
		this.scene.add(this.group);
		this.fertility_surface_renderer = new Renderer(fertility_surface);
		this.fertility_surface_renderer.faces.create({material: mesh_face_alpha_material}).add(this.group);


		this.fertility_skel = new Renderer(fertility_skel);
		this.fertility_skel.edges.create({material: mesh_edge_material}).add(this.group);

		this.fertility_vol = new Renderer(fertility_vol);
		this.fertility_vol.volumes.create({layer: 1, material: mesh_face_material}).add(this.group);
		this.fertility_vol.volumes.rescale(0.85);

		this.fertility_simplified_skel = new Renderer(fertility_simplified_skel);
		this.fertility_simplified_skel.edges.create({layer: 1, material: mesh_edge_material}).add(this.group);
		this.fertility_simplified_skel.vertices.create({layer: 1, color: 0x00ff00, size:0.025}).add(this.group);

		this.fertility_scaffold = new Renderer(fertility_scaffold);
		this.fertility_scaffold.edges.create({layer: 1, color: 0xFF0000}).add(this.group);


		// fertility_vol.set_embeddings(fertility_vol.vertex2);
		// fertility_vol.set_embeddings(fertility_vol.volume);
		// let scaled_jacobian = compute_scaled_jacobian(fertility_vol);

		// let sj, avg_sj = 0, min_sj = Infinity, nb = 0;
		// fertility_vol.foreach(fertility_vol.volume, wd => {
		// 	if(fertility_vol.is_boundary(wd))
		// 		return;
		// 	sj = scaled_jacobian[fertility_vol.cell(fertility_vol.volume, wd)];
		// 	avg_sj += sj;
		// 	++nb;
		// 	min_sj = min_sj > sj ? sj : min_sj;
		// });
		// console.log(avg_sj / nb, min_sj)


		const axis = new THREE.Vector3(0, 1, 0);
		let v = new THREE.Vector3;
		this.clock = new Clock(true);
		this.time = 0;
		console.log(this.camera.getWorldDirection(v))

		this.loop = function(){
			if(this.running){
				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 30 * this.time);
				this.fertility_vol.volumes.mesh.children.forEach(c => {c.getWorldPosition(v); c.visible = (v.x + v.z) < 0; });
				this.camera.layers.enable(0);
				this.renderer_input.render(this.scene, this.camera);
				this.camera.layers.disable(0);
				this.camera.layers.enable(1);
				this.renderer_output.render(this.scene, this.camera);
				this.camera.layers.disable(1);
				requestAnimationFrame(this.loop.bind(this));
			}
		}
	}
);

export let slide_process_0 = new Slide(
	function(surface, skel, skel_simple){
		this.camera = new THREE.PerspectiveCamera(75, surface.width / surface.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 0.8);

		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		let pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,5);
		ambiantLight.layers.enable(1);
		ambiantLight.layers.enable(2);
		ambiantLight.layers.enable(3);
		pointLight.layers.enable(1);
		pointLight.layers.enable(2);
		pointLight.layers.enable(3);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.surface_renderer = new Renderer(cactus_surface);
		this.surface_renderer.faces.create({material: mesh_face_material}).add(this.group);
		this.surface_renderer.edges.create({material: mesh_edge_material}).add(this.group);

		this.surface_alpha_renderer = new Renderer(cactus_surface);
		this.surface_alpha_renderer.faces.create({layer: 1, material: mesh_face_alpha_material}).add(this.group);

		this.skel_renderer = new Renderer(cactus_skel);
		this.skel_renderer.edges.create({layer: 2, material: mesh_edge_material}).add(this.group);
		this.skel_renderer.vertices.create({layer: 2, color: 0x00ff00, size:0.00625}).add(this.group);


		this.skel_simple_renderer = new Renderer(cactus_skel_simple);
		this.skel_simple_renderer.edges.create({layer: 3, material: mesh_edge_material}).add(this.group);
		this.skel_simple_renderer.vertices.create({layer: 3, color: 0x00ff00, size:0.025}).add(this.group);


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

		const axis = new THREE.Vector3(0, 1, 0);
		let v = new THREE.Vector3;
		this.clock = new Clock(true);
		this.time = 0;

		this.loop = function(){
			if(this.running){
				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 30 * this.time);
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
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		let pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,5);
		ambiantLight.layers.enable(1);
		ambiantLight.layers.enable(2);
		pointLight.layers.enable(1);
		pointLight.layers.enable(2);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.surface_renderer = new Renderer(cactus_surface);
		this.surface_renderer.faces.create({material: mesh_face_alpha_material}).add(this.group);

		this.scaffold_renderer = new Renderer(cactus_scaffold);
		this.scaffold_renderer.edges.create({layer: 0, color: 0xFF0000}).add(this.group);


		this.skel_renderer = new Renderer(cactus_skel_simple);
		this.skel_renderer.edges.create({material: mesh_edge_material}).add(this.group);
		this.skel_renderer.vertices.create({layer: 1, color: 0x00ff00, size:0.025}).add(this.group);

		this.initial_mesh_renderer = new Renderer(cactus_initial_mesh);
		this.initial_mesh_renderer.volumes.create({layer: 2, material: mesh_face_material}).add(this.group);
		this.initial_mesh_renderer.volumes.rescale(0.8);

		this.surface_fit_mesh_renderer = new Renderer(cactus_surface_fit_mesh);
		this.surface_fit_mesh_renderer.volumes.create({layer: 3, material: mesh_face_material}).add(this.group);
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
		

		const axis = new THREE.Vector3(0, 1, 0);
		let v = new THREE.Vector3;
		this.clock = new Clock(true);
		this.time = 0;
		this.loop = function(){
			if(this.running){
				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 30 * this.time);
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

				requestAnimationFrame(this.loop.bind(this));
			}
		}

	}
);

export let slide_process_2 = new Slide(
	function(result){
		this.camera = new THREE.PerspectiveCamera(75, result.width / result.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 0.6);

		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		let pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,5);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.initial_mesh_renderer = new Renderer(cactus_opt_mesh);
		this.initial_mesh_renderer.volumes.create({ material: mesh_face_alpha_material}).add(this.group);
		this.initial_mesh_renderer.volumes.rescale(0.8);

		this.renderer_result = new THREE.WebGLRenderer({
			canvas: result,
			antialias: true,
			alpha: true
		});
		let orbit_controls  = new OrbitControls(this.camera, this.renderer_result.domElement);

		const axis = new THREE.Vector3(0, 1, 0);
		let v = new THREE.Vector3;
		this.clock = new Clock(true);
		this.time = 0;
		this.loop = function(){
			if(this.running){
				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 30 * this.time);
				this.renderer_result.render(this.scene, this.camera);
				requestAnimationFrame(this.loop.bind(this));
			}
		}

	}
);