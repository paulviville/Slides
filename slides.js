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
let cactus_opt_mesh = load_cmap3('mesh', cactus_mesh);
let cactus_skel = load_graph('cg', cactus_cg);
let cactus_skel_simple = load_graph('cg', cactus_simplified_cg);
let cactus_scaffold = load_cmap2('off', cactus_scaffold_off);
let fertility_surface = load_cmap2('off', fertility_off);
let fertility_skel = load_graph('cg', fertility_cg);
let fertility_simplified_skel = load_graph('cg', fertility_simplified_cg);
let fertility_scaffold = load_cmap2('off', fertility_scaffold_off);
let fertility_vol = load_cmap3('mesh', fertility_mesh);

// let bb = BoundingBox(cactus_surface_fit_mesh.get_attribute(cactus_surface_fit_mesh.vertex, "position"))
// console.log(bb)
export let slide_overview = new Slide(
	function(input, output)
	{
		this.camera = new THREE.PerspectiveCamera(75, input.width / input.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 0.8);

		this.scene = new THREE.Scene()
		let ambiant = new THREE.AmbientLight(0xFFFFFF, 0.8);
		this.scene.add(ambiant);
		let pointLight0 = new THREE.PointLight(0xFFFFFF, 0.8);
		pointLight0.position.set(10,8,5);
		this.scene.add(pointLight0);

		this.scene2 = new THREE.Scene()
		let ambiant2 = new THREE.AmbientLight(0xFFFFFF, 0.8);
		this.scene2.add(ambiant2);
		let pointLight02 = new THREE.PointLight(0xFFFFFF, 0.8);
		pointLight02.position.set(10,8,5);
		this.scene2.add(pointLight02);

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

		this.fertility_surface_renderer = new Renderer(fertility_surface);
		this.fertility_surface_renderer.faces.create({material: mesh_face_alpha_material}).add(this.scene);


		this.graph_renderer = new Renderer(fertility_skel);
		this.graph_renderer.edges.create({material: mesh_edge_material}).add(this.scene);

		this.map_renderer3 = new Renderer(fertility_vol);
		this.map_renderer3.volumes.create({material: mesh_face_material}).add(this.scene2);
		this.map_renderer3.volumes.rescale(0.85);

		this.loop = function(){
			if(this.running){
				console.log("running");
				this.renderer_input.render(this.scene, this.camera);
				this.renderer_output.render(this.scene2, this.camera);
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
		pointLight.layers.enable(1);
		pointLight.layers.enable(2);
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

				requestAnimationFrame(this.loop.bind(this));
			}
		}

	}
);

export let slide_process_2 = new Slide(
	function(result){
		this.camera = new THREE.PerspectiveCamera(75, result.width / result.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 0.8);

		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, 0.8);
		let pointLight = new THREE.PointLight(0xFFFFFF, 0.8);
		pointLight.position.set(10,8,5);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.initial_mesh_renderer = new Renderer(cactus_opt_mesh);
		this.initial_mesh_renderer.volumes.create({ material: mesh_face_alpha_material}).add(this.scene);
		this.initial_mesh_renderer.volumes.rescale(0.8);

		this.renderer_result = new THREE.WebGLRenderer({
			canvas: result,
			antialias: true,
			alpha: true
		});
		let orbit_controls  = new OrbitControls(this.camera, this.renderer_result.domElement);

		this.loop = function(){
			if(this.running){
				this.renderer_result.render(this.scene, this.camera);
				requestAnimationFrame(this.loop.bind(this));
			}
		}

	}
);