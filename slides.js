import Slide from './Slide.js'
import Renderer from './CMapJS/Rendering/Renderer.js';
import Renderer_Spherical from './CMapJS/Rendering/Renderer_Spherical.js';

import * as THREE from './CMapJS/Dependencies/three.module.js';
import {OrbitControls} from './CMapJS/Dependencies/OrbitsControls.js';
import {load_graph} from './CMapJS/IO/Graph_Formats/Graph_IO.js' 
import {load_cmap2} from './CMapJS/IO/Surface_Formats/CMap2_IO.js' 
import {load_cmap3} from './CMapJS/IO/Volumes_Formats/CMap3_IO.js' 
import {cactus_off, cactus_scaffold_off, fertility_off, fertility_scaffold_off} from './Files/off_files.js';
import {cactus_simplified_cg, cactus_cg, fertility_simplified_cg, fertility_cg} from './Files/cg_files.js';
import {fertility_mesh} from './Files/fertility_files.js';
import {cactus0_mesh, cactus1_mesh, cactus_mesh, cactus_padding_mesh, cactus_subdivided_mesh} from './Files/cactus_files.js';
import {metatron_mesh, metatron_liv_mesh} from './Files/metatron_files.js';
import {dinopet_mesh} from './Files/dinopet_files.js';
import {BoundingBox} from './CMapJS/Utils/BoundingBox.js';
import compute_scaled_jacobian from './CMapJS/Modeling/Quality/Scaled_Jacobians.js';
import {Clock} from './CMapJS/Dependencies/three.module.js';
import * as SP from './Files/sphere_partition_files.js';

let main_renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true});

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
	linewidth: 0.5,
	polygonOffset: true,
	polygonOffsetFactor: -0.5
});

let ambiant_light_int = 0.4;
let point_light_int = 0.6;

let cactus_surface = load_cmap2('off', cactus_off);
let cactus_initial_mesh = load_cmap3('mesh', cactus0_mesh);
let cactus_surface_fit_mesh = load_cmap3('mesh', cactus1_mesh);
let cactus_padding = load_cmap3('mesh', cactus_padding_mesh);
let cactus_subdivided = load_cmap3('mesh', cactus_subdivided_mesh);
let cactus_opt_mesh = load_cmap3('mesh', cactus_mesh);
let cactus_skel = load_graph('cg', cactus_cg);
let cactus_skel_simple = load_graph('cg', cactus_simplified_cg);
let cactus_scaffold = load_cmap2('off', cactus_scaffold_off);

let fertility_surface = load_cmap2('off', fertility_off);
let fertility_skel = load_graph('cg', fertility_cg);
let fertility_simplified_skel = load_graph('cg', fertility_simplified_cg);
let fertility_scaffold = load_cmap2('off', fertility_scaffold_off);
let fertility_vol = load_cmap3('mesh', fertility_mesh);

let sphere_graph = load_graph('cg', SP.branches_cg);
let sphere_raw = load_cmap2("off", SP.delaunay_raw_off);
let sphere_remesh = load_cmap2("off", SP.delaunay_remeshed_off);
let sphere_dual = load_cmap2("off", SP.dual_off);

let flat_3_graph = load_graph('cg', SP.flat_3_cg);
let flat_4_graph = load_graph('cg', SP.flat_4_cg);
let flat_5_graph = load_graph('cg', SP.flat_5_cg);
let flat_3_surface = load_cmap2('off', SP.flat_3_off);
let flat_4_surface = load_cmap2('off', SP.flat_4_off);
let flat_5_surface = load_cmap2('off', SP.flat_5_off);

let ortho_3_graph = load_graph('cg', SP.ortho_3_cg);
let ortho_4_graph = load_graph('cg', SP.ortho_4_cg);
let ortho_5_graph = load_graph('cg', SP.ortho_5_cg);
let ortho_3_surface = load_cmap2('off', SP.ortho_3_off);
let ortho_4_surface = load_cmap2('off', SP.ortho_4_off);
let ortho_5_surface = load_cmap2('off', SP.ortho_5_off);

let metatron_liv = load_cmap3('mesh', metatron_liv_mesh);
let metatron = load_cmap3('mesh', metatron_mesh);

let dinopet_vol = load_cmap3('mesh', dinopet_mesh);


// console.log("padding");
let pos_pad = dinopet_vol.get_attribute(dinopet_vol.vertex, "position");
let bb = BoundingBox(pos_pad)
console.log(bb)


let green = new THREE.Color(0x2EEE71);
let red = new THREE.Color(0xF74C3C);

cactus_opt_mesh.set_embeddings(cactus_opt_mesh.vertex2);
cactus_opt_mesh.set_embeddings(cactus_opt_mesh.volume);
let scaled_jacobian = compute_scaled_jacobian(cactus_opt_mesh);
let sj, avg_sj = 0, min_sj = Infinity, max_sj = -Infinity, nb = 0;
cactus_opt_mesh.foreach(cactus_opt_mesh.volume, wd => {
	if(cactus_opt_mesh.is_boundary(wd))
		return;
	sj = scaled_jacobian[cactus_opt_mesh.cell(cactus_opt_mesh.volume, wd)];
	avg_sj += sj;
	++nb;
	min_sj = min_sj > sj ? sj : min_sj;
	max_sj = max_sj < sj ? sj : max_sj;
});

let cactus_volume_colors = cactus_opt_mesh.add_attribute(cactus_opt_mesh.volume, "volume_color");
let sj_diff = max_sj - min_sj;

cactus_opt_mesh.foreach(cactus_opt_mesh.volume, wd => {
	let sj_value = scaled_jacobian[cactus_opt_mesh.cell(cactus_opt_mesh.volume, wd)];
	let value = (sj_value - min_sj) / sj_diff;

	cactus_volume_colors[cactus_opt_mesh.cell(cactus_opt_mesh.volume, wd)] = red.clone().lerp(green, value);
});

fertility_vol.set_embeddings(fertility_vol.vertex2);
fertility_vol.set_embeddings(fertility_vol.volume);
let fertility_sj = compute_scaled_jacobian(fertility_vol);
sj, avg_sj = 0, min_sj = Infinity, max_sj = -Infinity, nb = 0;
fertility_vol.foreach(fertility_vol.volume, wd => {
	if(fertility_vol.is_boundary(wd))
		return;
	sj = fertility_sj[fertility_vol.cell(fertility_vol.volume, wd)];
	avg_sj += sj;
	++nb;
	min_sj = min_sj > sj ? sj : min_sj;
	max_sj = max_sj < sj ? sj : max_sj;
});

let fertility_volume_colors = fertility_vol.add_attribute(fertility_vol.volume, "volume_color");
sj_diff = max_sj - min_sj;
fertility_vol.foreach(fertility_vol.volume, wd => {
	let sj_value = fertility_sj[fertility_vol.cell(fertility_vol.volume, wd)];
	let value = (sj_value - min_sj) / sj_diff;

	fertility_volume_colors[fertility_vol.cell(fertility_vol.volume, wd)] = red.clone().lerp(green, value);
});

dinopet_vol.set_embeddings(dinopet_vol.vertex2);
dinopet_vol.set_embeddings(dinopet_vol.volume);
let dinopet_sj = compute_scaled_jacobian(dinopet_vol);
sj, avg_sj = 0, min_sj = Infinity, max_sj = -Infinity, nb = 0;
dinopet_vol.foreach(dinopet_vol.volume, wd => {
	if(dinopet_vol.is_boundary(wd))
		return;
	sj = dinopet_sj[dinopet_vol.cell(dinopet_vol.volume, wd)];
	avg_sj += sj;
	++nb;
	min_sj = min_sj > sj ? sj : min_sj;
	max_sj = max_sj < sj ? sj : max_sj;
});

let dinopet_volume_colors = dinopet_vol.add_attribute(dinopet_vol.volume, "volume_color");
sj_diff = max_sj - min_sj;
dinopet_vol.foreach(dinopet_vol.volume, wd => {
	let sj_value = dinopet_sj[dinopet_vol.cell(dinopet_vol.volume, wd)];
	let value = (sj_value - min_sj) / sj_diff;

	dinopet_volume_colors[dinopet_vol.cell(dinopet_vol.volume, wd)] = red.clone().lerp(green, value);
});


function clip_volumes( vol_renderer,
	planes = [[0, 0, 1]], offset = 0, 
	min = 0, max = 0.95, speed = 0.05){
	let v = new THREE.Vector3;
	vol_renderer.volumes.mesh.children.forEach(
	c => {
		c.getWorldPosition(v); 
		planes.forEach(p => {
			if((p[0] * v.x + p[1] * v.y + p[2] * v.z) > offset){
				let scale = c.scale.x;
				if(scale > min){
					scale -= speed;
					c.scale.set(scale, scale, scale);
				}
			}
			else{
				let scale = c.scale.x;
				if(scale < max){
					scale += speed;
					c.scale.set(scale, scale, scale);
				}
			}
		})
	});
}

function change_volumes_material(vol_renderer, new_mat){
	vol_renderer.volumes.mesh.children.forEach(
		c => {
			c.material = new_mat;
		});
}

// let bb = BoundingBox(fertility_simplified_skel.get_attribute(fertility_simplified_skel.vertex, "position"))
// console.log(bb)
export let slide_overview = new Slide(
	function(DOM_input, DOM_output)
	{
		this.camera = new THREE.PerspectiveCamera(75, DOM_input.width / DOM_input.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 0.8);

		const input_layer = 0;
		const output_layer = 1;

		const context_input = DOM_input.getContext('2d');
		const context_output = DOM_output.getContext('2d');

		const orbit_controls_input = new OrbitControls(this.camera, DOM_input);
		const orbit_controls_output = new OrbitControls(this.camera, DOM_output);

		this.scene = new THREE.Scene()
		const ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		const pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,5);

		ambiantLight.layers.enable(input_layer);
		pointLight.layers.enable(input_layer);
		ambiantLight.layers.enable(output_layer);
		pointLight.layers.enable(output_layer);
		
		this.scene.add(pointLight);
		this.scene.add(ambiantLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);
		this.fertility_surface_renderer = new Renderer(fertility_surface);
		this.fertility_surface_renderer.faces.create({layer: input_layer, material: mesh_face_alpha_material}).add(this.group);

		this.fertility_skel = new Renderer(fertility_skel);
		this.fertility_skel.edges.create({layer: input_layer,material: mesh_edge_material}).add(this.group);

		this.fertility_vol = new Renderer(fertility_vol);
		this.fertility_vol.volumes.create({layer: output_layer, material: mesh_face_material}).add(this.group);
		this.fertility_vol.volumes.rescale(0.85);

		// this.fertility_simplified_skel = new Renderer(fertility_simplified_skel);
		// this.fertility_simplified_skel.edges.create({layer: output_layer, material: mesh_edge_material}).add(this.group);
		// this.fertility_simplified_skel.vertices.create({layer: output_layer, color: 0x00ff00, size:0.025}).add(this.group);

		// this.fertility_scaffold = new Renderer(fertility_scaffold);
		// this.fertility_scaffold.edges.create({layer: output_layer, color: 0xFF0000}).add(this.group);

		const axis = new THREE.Vector3(0, 1, 0);
		let v = new THREE.Vector3;
		this.clock = new Clock(true);
		this.time = 0;
		this.clipping = false;
		this.toggle_clipping = function(){
			this.clipping = !this.clipping
			if(!this.clipping)
				this.fertility_vol.volumes.rescale(0.85);
		};

		this.loop = function(){
			if(this.running){
				if(this.clipping){
					clip_volumes(this.fertility_vol, [[1, 0, 1]], 0.05, 0, 0.85);
				}

				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 30 * this.time);

				this.camera.layers.enable(input_layer);
				main_renderer.setSize(DOM_input.width, DOM_input.height);
				main_renderer.render(this.scene, this.camera);
				context_input.clearRect(0, 0, DOM_input.width, DOM_input.height);
				context_input.drawImage(main_renderer.domElement, 0, 0)
				this.camera.layers.disable(input_layer);

				this.camera.layers.enable(output_layer);
				main_renderer.render(this.scene, this.camera);
				context_output.clearRect(0, 0, DOM_output.width, DOM_output.height);
				context_output.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(output_layer);

				requestAnimationFrame(this.loop.bind(this));
			}
		}
	}
);

export let slide_process_0 = new Slide(
	function(DOM_surface, DOM_skel, DOM_skel_simple){
		const surface_layer = 0;
		const surface_alpha_layer = 1;
		const skel_layer = 2;
		const skel_simple_layer = 3;

		const context_surface = DOM_surface.getContext('2d');
		const context_skel = DOM_skel.getContext('2d');
		const context_skel_simple = DOM_skel_simple.getContext('2d');

		this.camera = new THREE.PerspectiveCamera(75, DOM_surface.width / DOM_surface.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 0.6);
		
		const orbit_controls_surface = new OrbitControls(this.camera, DOM_surface);
		const orbit_controls_skel = new OrbitControls(this.camera, DOM_skel);
		const orbit_controls_skel_simple = new OrbitControls(this.camera, DOM_skel_simple);

		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		let pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,5);
		ambiantLight.layers.enable(0);
		ambiantLight.layers.enable(1);
		ambiantLight.layers.enable(2);
		ambiantLight.layers.enable(3);
		pointLight.layers.enable(0);
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
		this.surface_alpha_renderer.faces.create({layer: surface_alpha_layer, material: mesh_face_alpha_material}).add(this.group);

		this.skel_renderer = new Renderer(cactus_skel);
		this.skel_renderer.edges.create({layer: skel_layer, material: mesh_edge_material}).add(this.group);
		this.skel_renderer.vertices.create({layer: skel_layer, color: 0x00ff00, size:0.00625}).add(this.group);


		this.skel_simple_renderer = new Renderer(cactus_skel_simple);
		this.skel_simple_renderer.edges.create({layer: skel_simple_layer, material: mesh_edge_material}).add(this.group);
		this.skel_simple_renderer.vertices.create({layer: skel_simple_layer, color: 0x00ff00, size:0.025}).add(this.group);

		const axis = new THREE.Vector3(0, 1, 0);
		this.clock = new Clock(true);
		this.time = 0;

		this.loop = function(){
			if(this.running){
				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 30 * this.time);
				
				this.camera.layers.enable(surface_layer);
				main_renderer.setSize(DOM_surface.width, DOM_surface.height);
				main_renderer.render(this.scene, this.camera);
				context_surface.clearRect(0, 0, DOM_surface.width, DOM_surface.height);
				context_surface.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(surface_layer);

				this.camera.layers.enable(surface_alpha_layer);
				this.camera.layers.enable(skel_layer);
				main_renderer.render(this.scene, this.camera);
				context_skel.clearRect(0, 0, DOM_skel.width, DOM_skel.height);
				context_skel.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(skel_layer);

				this.camera.layers.enable(skel_simple_layer);
				main_renderer.render(this.scene, this.camera);
				context_skel_simple.clearRect(0, 0, DOM_skel_simple.width, DOM_skel_simple.height);
				context_skel_simple.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(skel_simple_layer);
				this.camera.layers.disable(surface_alpha_layer);
				requestAnimationFrame(this.loop.bind(this));
			}
		}

	}
);

export let slide_process_1 = new Slide(
	function(DOM_scaffold, DOM_initial_mesh, DOM_surface_fit_mesh){
		const base_layer = 0;
		const scaffold_layer = 1;
		const initial_mesh_layer = 2;
		const surface_fit_mesh_layer = 3;

		const context_scaffold = DOM_scaffold.getContext('2d');
		const context_initial_mesh = DOM_initial_mesh.getContext('2d');
		const context_surface_fit_mesh = DOM_surface_fit_mesh.getContext('2d');

		this.camera = new THREE.PerspectiveCamera(75, DOM_scaffold.width / DOM_scaffold.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 0.6);

		const orbit_controls_scaffold = new OrbitControls(this.camera, DOM_scaffold);
		const orbit_controls_initial_mesh = new OrbitControls(this.camera, DOM_initial_mesh);
		const orbit_controls_surface_fit_mesh = new OrbitControls(this.camera, DOM_surface_fit_mesh);
		

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
		this.surface_renderer.faces.create({layer: base_layer, material: mesh_face_alpha_material}).add(this.group);

		this.scaffold_renderer = new Renderer(cactus_scaffold);
		this.scaffold_renderer.edges.create({layer: scaffold_layer, color: 0xFF0000}).add(this.group);


		this.skel_renderer = new Renderer(cactus_skel_simple);
		this.skel_renderer.edges.create({material: mesh_edge_material}).add(this.group);
		this.skel_renderer.vertices.create({layer: scaffold_layer, color: 0x00ff00, size:0.025}).add(this.group);

		this.initial_mesh_renderer = new Renderer(cactus_initial_mesh);
		this.initial_mesh_renderer.volumes.create({layer: initial_mesh_layer, material: mesh_face_material}).add(this.group);
		this.initial_mesh_renderer.volumes.rescale(0.8);

		this.surface_fit_mesh_renderer = new Renderer(cactus_surface_fit_mesh);
		this.surface_fit_mesh_renderer.volumes.create({layer: surface_fit_mesh_layer, material: mesh_face_material}).add(this.group);
		this.surface_fit_mesh_renderer.volumes.rescale(0.85);

		const axis = new THREE.Vector3(0, 1, 0);
		this.clock = new Clock(true);
		this.time = 0;
		this.loop = function(){
			if(this.running){
				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 30 * this.time);

				this.camera.layers.enable(base_layer);
				this.camera.layers.enable(scaffold_layer);
				main_renderer.setSize(DOM_scaffold.width, DOM_scaffold.height);
				main_renderer.render(this.scene, this.camera);
				context_scaffold.clearRect(0, 0, DOM_scaffold.width, DOM_scaffold.height);
				context_scaffold.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(scaffold_layer);

				this.camera.layers.enable(initial_mesh_layer);
				main_renderer.render(this.scene, this.camera);
				context_initial_mesh.clearRect(0, 0, DOM_initial_mesh.width, DOM_initial_mesh.height);
				context_initial_mesh.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(initial_mesh_layer);

				this.camera.layers.enable(surface_fit_mesh_layer);
				main_renderer.render(this.scene, this.camera);
				context_surface_fit_mesh.clearRect(0, 0, DOM_surface_fit_mesh.width, DOM_surface_fit_mesh.height);
				context_surface_fit_mesh.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(surface_fit_mesh_layer);

				requestAnimationFrame(this.loop.bind(this));
			}
		}

	}
);

export let slide_process_2 = new Slide(
	function(DOM_padding, DOM_result, DOM_quality){
		const base_layer = 0;
		const padding_layer = 1;
		const result_layer = 2;
		const quality_layer = 3;

		const context_padding = DOM_padding.getContext('2d');
		const context_result = DOM_result.getContext('2d');
		const context_quality = DOM_quality.getContext('2d');

		this.camera = new THREE.PerspectiveCamera(75, DOM_result.width / DOM_result.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 0.6);

		const orbit_controls0  = new OrbitControls(this.camera, DOM_padding);
		const orbit_controls1  = new OrbitControls(this.camera, DOM_result);
		const orbit_controls2  = new OrbitControls(this.camera, DOM_quality);

		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		let pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,5);
		ambiantLight.layers.enable(padding_layer);
		pointLight.layers.enable(padding_layer);
		ambiantLight.layers.enable(result_layer);
		pointLight.layers.enable(result_layer);
		ambiantLight.layers.enable(quality_layer);
		pointLight.layers.enable(quality_layer);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.surface_renderer = new Renderer(cactus_surface);
		this.surface_renderer.faces.create({
			layer: base_layer,
			material: new THREE.MeshLambertMaterial({
				color: 0x888888,
				transparent: true,
				opacity: 0.2
			})
		}).add(this.group);

		this.cactus_padding = new Renderer(cactus_padding);
		this.cactus_padding.volumes.create({layer: padding_layer,  material: mesh_face_material}).add(this.group);
		this.cactus_padding.volumes.rescale(0.8);

		this.initial_mesh_renderer = new Renderer(cactus_opt_mesh);
		this.initial_mesh_renderer.volumes.create({layer: quality_layer, volume_colors: cactus_volume_colors}).add(this.group);
		this.initial_mesh_renderer.volumes.rescale(0.8);

		this.cactus_opt_mesh = new Renderer(cactus_subdivided);
		this.cactus_opt_mesh.volumes.create({layer: result_layer, material: mesh_face_material}).add(this.group);
		this.cactus_opt_mesh.volumes.rescale(0.8);

		const axis = new THREE.Vector3(0, 1, 0);
		let v = new THREE.Vector3;
		this.clock = new Clock(true);
		this.time = 0;

		let material0 = this.initial_mesh_renderer.volumes.mesh.children[0].material;
		let material1 = mesh_face_material;
		this.toggle_material = function(){
			if(this.initial_mesh_renderer.volumes.mesh.children[0].material == material0)
				change_volumes_material(this.initial_mesh_renderer, material1);
			else
				change_volumes_material(this.initial_mesh_renderer, material0);
		}

		this.toggle_material();

		this.loop = function(){
			if(this.running){
				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 30 * this.time);
				clip_volumes(this.initial_mesh_renderer, [[1, 0, 1]], 0, 0, 0.95);
				clip_volumes(this.cactus_padding, [[1, 0, 1]], 0, 0, 0.85);
				clip_volumes(this.cactus_opt_mesh, [[1, 0, 1]], 0, 0, 0.85);

				this.camera.layers.enable(padding_layer);
				main_renderer.setSize(DOM_padding.width, DOM_padding.height);
				main_renderer.render(this.scene, this.camera);
				context_padding.clearRect(0, 0, DOM_padding.width, DOM_padding.height);
				context_padding.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(padding_layer);

				this.camera.layers.enable(result_layer);
				main_renderer.render(this.scene, this.camera);
				context_result.clearRect(0, 0, DOM_result.width, DOM_result.height);
				context_result.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(result_layer);

				this.camera.layers.enable(quality_layer);
				main_renderer.render(this.scene, this.camera);
				context_quality.clearRect(0, 0, DOM_quality.width, DOM_quality.height);
				context_quality.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(quality_layer);

				requestAnimationFrame(this.loop.bind(this));
			}
		}

	}

);


let sphere_mat = new THREE.MeshLambertMaterial({color: 0xEEEEEE, transparent: true, opacity: 0.850});
let sphere_geom = new THREE.SphereGeometry( 0.995, 64, 64 );
let point_geom = new THREE.SphereGeometry( 0.035, 16, 16 );
let point_mat = new THREE.MeshLambertMaterial({color: 0xFF0000});


export let slide_sphere_partition = new Slide(
	function(DOM_points, DOM_raw, DOM_remesh, DOM_dual, DOM_result){
		const points_layer = 0;
		const raw_layer = 1;
		const remesh_layer = 2;
		const dual_layer = 3;

		const context_points = DOM_points.getContext('2d');
		const context_raw = DOM_raw.getContext('2d');
		const context_remesh = DOM_remesh.getContext('2d');
		const context_dual = DOM_dual.getContext('2d');
		const context_result = DOM_result.getContext('2d');

		this.camera = new THREE.PerspectiveCamera(75, DOM_result.width / DOM_result.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 1.8);

		let orbit_controls0  = new OrbitControls(this.camera, DOM_points);
		let orbit_controls1  = new OrbitControls(this.camera, DOM_raw);
		let orbit_controls2  = new OrbitControls(this.camera, DOM_remesh);
		let orbit_controls3  = new OrbitControls(this.camera, DOM_dual);
		let orbit_controls4  = new OrbitControls(this.camera, DOM_result);

		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		let pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,5);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		let sphere =  new THREE.Mesh(sphere_geom, sphere_mat);
		this.group.add(sphere);

		let points = new THREE.Group;
		this.group.add(points);
		let points_pos = sphere_graph.get_attribute(sphere_graph.vertex, "position");
		sphere_graph.foreach(sphere_graph.vertex, vd => {
			let point = new THREE.Mesh(point_geom, point_mat);
			point.position.copy(points_pos[sphere_graph.cell(sphere_graph.vertex, vd)]);
			point.layers.set(points_layer);
			points.add(point);
		})

		let branching_point_renderer = new Renderer(sphere_graph);
		branching_point_renderer.edges.create({layer: points_layer, material: mesh_edge_material}).add(this.group);

		let raw_delaunay_renderer = new Renderer_Spherical(sphere_raw);
		raw_delaunay_renderer.geodesics.create({layer: raw_layer, color: 0x0011FF}).add(this.group);

		let remeshed_delaunay_renderer = new Renderer_Spherical(sphere_remesh);
		remeshed_delaunay_renderer.geodesics.create({layer: remesh_layer, color: 0x11DD44}).add(this.group);

		let dual_renderer = new Renderer_Spherical(sphere_dual);
		dual_renderer.geodesics.create({layer: dual_layer, color: 0xFF2222}).add(this.group);

		const axis = new THREE.Vector3(0, 1, 0);
		this.clock = new Clock(true);
		this.time = 0;
		this.loop = function(){
			if(this.running){
				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 60 * this.time);

				this.camera.layers.enable(points_layer);

				main_renderer.setSize(DOM_points.width, DOM_points.height);
				main_renderer.render(this.scene, this.camera);
				context_points.clearRect(0, 0, DOM_points.width, DOM_points.height);
				context_points.drawImage(main_renderer.domElement, 0, 0);

				this.camera.layers.enable(raw_layer);
				main_renderer.render(this.scene, this.camera);
				context_raw.clearRect(0, 0, DOM_raw.width, DOM_raw.height);
				context_raw.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(raw_layer);

				this.camera.layers.enable(remesh_layer);
				main_renderer.render(this.scene, this.camera);
				context_remesh.clearRect(0, 0, DOM_remesh.width, DOM_remesh.height);
				context_remesh.drawImage(main_renderer.domElement, 0, 0);

				this.camera.layers.enable(dual_layer);
				main_renderer.render(this.scene, this.camera);
				context_dual.clearRect(0, 0, DOM_dual.width, DOM_dual.height);
				context_dual.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(remesh_layer);

				main_renderer.render(this.scene, this.camera);
				context_result.clearRect(0, 0, DOM_result.width, DOM_result.height);
				context_result.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(dual_layer);

				requestAnimationFrame(this.loop.bind(this));
			}
		}

	}
);

export let slide_flat_partition = new Slide(
	function(DOM_3points, DOM_4points, DOM_5points){
		const base_layer = 0;
		const points3_layer = 1;
		const points4_layer = 2;
		const points5_layer = 3;

		const context_points3 = DOM_3points.getContext('2d');
		const context_points4 = DOM_4points.getContext('2d');
		const context_points5 = DOM_5points.getContext('2d');

		this.camera = new THREE.PerspectiveCamera(75, DOM_3points.width / DOM_3points.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 1.8);

		const orbit_controls0  = new OrbitControls(this.camera, DOM_3points);
		const orbit_controls1  = new OrbitControls(this.camera, DOM_4points);
		const orbit_controls2  = new OrbitControls(this.camera, DOM_5points);

		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		let pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,5);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		let sphere =  new THREE.Mesh(sphere_geom, sphere_mat);
		sphere.layers.set(base_layer);
		this.group.add(sphere);

		let points3 = new THREE.Group;
		this.group.add(points3);
		let points_pos = flat_3_graph.get_attribute(flat_3_graph.vertex, "position");
		flat_3_graph.foreach(flat_3_graph.vertex, vd => {
			let point = new THREE.Mesh(point_geom, point_mat);
			point.position.copy(points_pos[flat_3_graph.cell(flat_3_graph.vertex, vd)]);
			point.layers.set(points3_layer);
			points3.add(point);
		});

		let points4 = new THREE.Group;
		this.group.add(points4);
		points_pos = flat_4_graph.get_attribute(flat_4_graph.vertex, "position");
		flat_4_graph.foreach(flat_4_graph.vertex, vd => {
			let point = new THREE.Mesh(point_geom, point_mat);
			point.position.copy(points_pos[flat_4_graph.cell(flat_4_graph.vertex, vd)]);
			point.layers.set(points4_layer);
			points4.add(point);
		});

		let points5 = new THREE.Group;
		this.group.add(points5);
		points_pos = flat_5_graph.get_attribute(flat_5_graph.vertex, "position");
		flat_5_graph.foreach(flat_5_graph.vertex, vd => {
			let point = new THREE.Mesh(point_geom, point_mat);
			point.position.copy(points_pos[flat_5_graph.cell(flat_5_graph.vertex, vd)]);
			point.layers.set(points5_layer);
			points5.add(point);
		});

		let flat3_graph_renderer = new Renderer(flat_3_graph);
		flat3_graph_renderer.edges.create({layer: points3_layer, material: mesh_edge_material}).add(this.group);
		
		let flat4_graph_renderer = new Renderer(flat_4_graph);
		flat4_graph_renderer.edges.create({layer: points4_layer, material: mesh_edge_material}).add(this.group);
		
		let flat5_graph_renderer = new Renderer(flat_5_graph);
		flat5_graph_renderer.edges.create({layer: points5_layer, material: mesh_edge_material}).add(this.group);

		let flat3_surface_renderer = new Renderer_Spherical(flat_3_surface);
		flat3_surface_renderer.geodesics.create({layer: points3_layer, color: 0xFF2222}).add(this.group);
		flat3_surface_renderer.vertices.create({size: 0.06125, layer: points3_layer, color: 0xFF2222}).add(this.group);

		let flat4_surface_renderer = new Renderer_Spherical(flat_4_surface);
		flat4_surface_renderer.geodesics.create({layer: points4_layer, color: 0xFF2222}).add(this.group);
		flat4_surface_renderer.vertices.create({size: 0.06125, layer: points4_layer, color: 0xFF2222}).add(this.group);

		let flat5_surface_renderer = new Renderer_Spherical(flat_5_surface);
		flat5_surface_renderer.geodesics.create({layer: points5_layer, color: 0xFF2222}).add(this.group);
		flat5_surface_renderer.vertices.create({size: 0.06125, layer: points5_layer, color: 0xFF2222}).add(this.group);

		const axis = new THREE.Vector3(0, 1, 0);
		this.clock = new Clock(true);
		this.time = 0;
		this.loop = function(){
			if(this.running){
				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 60 * this.time);

				this.camera.layers.enable(base_layer);

				this.camera.layers.enable(points3_layer);
				main_renderer.setSize(DOM_3points.width, DOM_3points.height);
				main_renderer.render(this.scene, this.camera);
				context_points3.clearRect(0, 0, DOM_3points.width, DOM_3points.height);
				context_points3.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(points3_layer);

				this.camera.layers.enable(points4_layer);
				main_renderer.render(this.scene, this.camera);
				context_points4.clearRect(0, 0, DOM_4points.width, DOM_4points.height);
				context_points4.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(points4_layer);

				this.camera.layers.enable(points5_layer);
				main_renderer.render(this.scene, this.camera);
				context_points5.clearRect(0, 0, DOM_5points.width, DOM_5points.height);
				context_points5.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(points5_layer);

				requestAnimationFrame(this.loop.bind(this));
			}
		}

	}
);

let cube_geom = new THREE.BoxGeometry( 0.7, 0.7, 0.7);
let cube_mat = new THREE.MeshLambertMaterial({color: 0xEEEEEE, transparent: true, opacity: 0.50});


export let slide_ortho_partition = new Slide(
	function(DOM_3points, DOM_4points, DOM_5points){
		const base_layer = 0;
		const points3_layer = 1;
		const points4_layer = 2;
		const points5_layer = 3;

		const context_points3 = DOM_3points.getContext('2d');
		const context_points4 = DOM_4points.getContext('2d');
		const context_points5 = DOM_5points.getContext('2d');

		this.camera = new THREE.PerspectiveCamera(75, DOM_3points.width / DOM_3points.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 2.1);

		const orbit_controls0  = new OrbitControls(this.camera, DOM_3points);
		const orbit_controls1  = new OrbitControls(this.camera, DOM_4points);
		const orbit_controls2  = new OrbitControls(this.camera, DOM_5points);

		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		let pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,5);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		let cubes = new THREE.Group;
		let cube = new THREE.Mesh(cube_geom, cube_mat);
		cubes.add(cube);
		cube.layers.set(base_layer);
		cube.position.set(0.4, 0.4, 0.4)
		cube = new THREE.Mesh(cube_geom, cube_mat);
		cubes.add(cube);
		cube.layers.set(base_layer);
		cube.position.set(0.4, -0.4, 0.4)
		cube = new THREE.Mesh(cube_geom, cube_mat);
		cubes.add(cube);
		cube.layers.set(base_layer);
		cube.position.set(0.4, -0.4, -0.4)
		cube = new THREE.Mesh(cube_geom, cube_mat);
		cubes.add(cube);
		cube.layers.set(base_layer);
		cube.position.set(0.4, 0.4, -0.4)
		cube = new THREE.Mesh(cube_geom, cube_mat);
		cubes.add(cube);
		cube.layers.set(base_layer);
		cube.position.set(-0.4, 0.4, 0.4)
		cube = new THREE.Mesh(cube_geom, cube_mat);
		cubes.add(cube);
		cube.layers.set(base_layer);
		cube.position.set(-0.4, -0.4, 0.4)
		cube = new THREE.Mesh(cube_geom, cube_mat);
		cubes.add(cube);
		cube.layers.set(base_layer);
		cube.position.set(-0.4, -0.4, -0.4)
		cube = new THREE.Mesh(cube_geom, cube_mat);
		cubes.add(cube);
		cube.layers.set(base_layer);
		cube.position.set(-0.4, 0.4, -0.4)
		this.group.add(cubes);

		let points3 = new THREE.Group;
		this.group.add(points3);
		let points_pos = ortho_3_graph.get_attribute(ortho_3_graph.vertex, "position");
		ortho_3_graph.foreach(ortho_3_graph.vertex, vd => {
			let point = new THREE.Mesh(point_geom, point_mat);
			point.position.copy(points_pos[ortho_3_graph.cell(ortho_3_graph.vertex, vd)]);
			point.layers.set(points3_layer);
			points3.add(point);
		});

		let points4 = new THREE.Group;
		this.group.add(points4);
		points_pos = ortho_4_graph.get_attribute(ortho_4_graph.vertex, "position");
		ortho_4_graph.foreach(ortho_4_graph.vertex, vd => {
			let point = new THREE.Mesh(point_geom, point_mat);
			point.position.copy(points_pos[ortho_4_graph.cell(ortho_4_graph.vertex, vd)]);
			point.layers.set(points4_layer);
			points4.add(point);
		});

		let points5 = new THREE.Group;
		this.group.add(points5);
		points_pos = ortho_5_graph.get_attribute(ortho_5_graph.vertex, "position");
		ortho_5_graph.foreach(ortho_5_graph.vertex, vd => {
			let point = new THREE.Mesh(point_geom, point_mat);
			point.position.copy(points_pos[ortho_5_graph.cell(ortho_5_graph.vertex, vd)]);
			point.layers.set(points5_layer);
			points5.add(point);
		});

		let ortho3_graph_renderer = new Renderer(ortho_3_graph);
		ortho3_graph_renderer.edges.create({layer: points3_layer, material: mesh_edge_material}).add(this.group);
		
		let ortho4_graph_renderer = new Renderer(ortho_4_graph);
		ortho4_graph_renderer.edges.create({layer: points4_layer, material: mesh_edge_material}).add(this.group);
		
		let ortho5_graph_renderer = new Renderer(ortho_5_graph);
		ortho5_graph_renderer.edges.create({layer: points5_layer, material: mesh_edge_material}).add(this.group);

		let ortho3_surface_renderer = new Renderer_Spherical(ortho_3_surface);
		ortho3_surface_renderer.geodesics.create({layer: points3_layer, color: 0xFF2222}).add(this.group);
		ortho3_surface_renderer.vertices.create({size: 0.06125, layer: points3_layer, color: 0xFF2222}).add(this.group);

		let ortho4_surface_renderer = new Renderer_Spherical(ortho_4_surface);
		ortho4_surface_renderer.geodesics.create({layer: points4_layer, color: 0xFF2222}).add(this.group);
		ortho4_surface_renderer.vertices.create({size: 0.06125, layer: points4_layer, color: 0xFF2222}).add(this.group);

		let ortho5_surface_renderer = new Renderer_Spherical(ortho_5_surface);
		ortho5_surface_renderer.geodesics.create({layer: points5_layer, color: 0xFF2222}).add(this.group);
		ortho5_surface_renderer.vertices.create({size: 0.06125, layer: points5_layer, color: 0xFF2222}).add(this.group);

		const axis = new THREE.Vector3(0.3, 0.7, 0).normalize();
		this.clock = new Clock(true);
		this.time = 0;
		this.loop = function(){
			if(this.running){
				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 60 * this.time);

				this.camera.layers.enable(base_layer);

				this.camera.layers.enable(points3_layer);
				main_renderer.setSize(DOM_3points.width, DOM_3points.height);
				main_renderer.render(this.scene, this.camera);
				context_points3.clearRect(0, 0, DOM_3points.width, DOM_3points.height);
				context_points3.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(points3_layer);

				this.camera.layers.enable(points4_layer);
				main_renderer.render(this.scene, this.camera);
				context_points4.clearRect(0, 0, DOM_4points.width, DOM_4points.height);
				context_points4.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(points4_layer);

				this.camera.layers.enable(points5_layer);
				main_renderer.render(this.scene, this.camera);
				context_points5.clearRect(0, 0, DOM_5points.width, DOM_5points.height);
				context_points5.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(points5_layer);

				requestAnimationFrame(this.loop.bind(this));
			}
		}

	}
);


export let slide_metatron_comparison = new Slide(
	function(DOM_livesu, DOM_ours){
		const livesu_layer = 0;
		const our_layer = 1;

		const context_livesu = DOM_livesu.getContext('2d');
		const context_ours = DOM_ours.getContext('2d');

		this.camera = new THREE.PerspectiveCamera(75, DOM_livesu.width / DOM_livesu.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 1.8);

		const orbit_controls0  = new OrbitControls(this.camera, DOM_livesu);
		const orbit_controls1  = new OrbitControls(this.camera, DOM_ours);

		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		let pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,5);
		ambiantLight.layers.enable(livesu_layer);
		pointLight.layers.enable(livesu_layer);
		ambiantLight.layers.enable(our_layer);
		pointLight.layers.enable(our_layer);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.metatron_liv_renderer = new Renderer(metatron_liv);
		this.metatron_liv_renderer.volumes.create({layer: livesu_layer, material: mesh_face_material}).add(this.group);
		this.metatron_liv_renderer.volumes.rescale(0.85);

		this.metatron_renderer = new Renderer(metatron);
		this.metatron_renderer.volumes.create({layer: our_layer, material: mesh_face_material}).add(this.group);
		this.metatron_renderer.volumes.rescale(0.85);

		const axis = new THREE.Vector3(0.3, 0.7, 0).normalize();
		this.clock = new Clock(true);
		this.time = 0;
		this.clipping = false;
		this.toggle_clipping = function(){
			this.clipping = !this.clipping
			if(!this.clipping){
				this.metatron_renderer.volumes.rescale(0.85);
				this.metatron_liv_renderer.volumes.rescale(0.85);
			}
		};
		this.loop = function(){
			if(this.running){
				if(this.clipping){
					clip_volumes(this.metatron_renderer);
					clip_volumes(this.metatron_liv_renderer);
				}
				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 30 * this.time);

				this.camera.layers.enable(livesu_layer);
				main_renderer.setSize(DOM_livesu.width, DOM_livesu.height);
				main_renderer.render(this.scene, this.camera);
				context_livesu.clearRect(0, 0, DOM_livesu.width, DOM_livesu.height);
				context_livesu.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(livesu_layer);

				this.camera.layers.enable(our_layer);
				main_renderer.render(this.scene, this.camera);
				context_ours.clearRect(0, 0, DOM_ours.width, DOM_ours.height);
				context_ours.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(our_layer);


				requestAnimationFrame(this.loop.bind(this));
			}
		}
	}
);

export let slide_fertility_result = new Slide(
	function(DOM_fertility){
		const base_layer = 0;

		const context_fertility = DOM_fertility.getContext('2d');

		this.camera = new THREE.PerspectiveCamera(75, DOM_fertility.width / DOM_fertility.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 0.6);

		const orbit_controls0  = new OrbitControls(this.camera, DOM_fertility);

		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		let pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,5);
		ambiantLight.layers.enable(base_layer);
		pointLight.layers.enable(base_layer);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.fertility_renderer = new Renderer(fertility_vol);
		this.fertility_renderer.volumes.create({layer: base_layer, volume_colors: fertility_volume_colors}).add(this.group);
		this.fertility_renderer.volumes.rescale(0.85);

		const axis = new THREE.Vector3(0, 1, 0).normalize();
		this.clock = new Clock(true);
		this.time = 0;

		let material0 = this.fertility_renderer.volumes.mesh.children[0].material;
		let material1 = mesh_face_material;
		this.toggle_material = function(){
			if(this.fertility_renderer.volumes.mesh.children[0].material == material0)
				change_volumes_material(this.fertility_renderer, material1);
			else
				change_volumes_material(this.fertility_renderer, material0);
		}
		this.toggle_material();

		this.clipping = false;
		this.toggle_clipping = function(){
			this.clipping = !this.clipping
			if(!this.clipping){
				this.fertility_renderer.volumes.rescale(0.85);
			}
		};
		this.loop = function(){
			if(this.running){
				if(this.clipping){
					clip_volumes(this.fertility_renderer);
				}
				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 30 * this.time);

				this.camera.layers.enable(base_layer);
				main_renderer.setSize(DOM_fertility.width, DOM_fertility.height);
				main_renderer.render(this.scene, this.camera);
				context_fertility.clearRect(0, 0, DOM_fertility.width, DOM_fertility.height);
				context_fertility.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(base_layer);


				requestAnimationFrame(this.loop.bind(this));
			}
		}
	}
);

export let slide_dinopet_result = new Slide(
	function(DOM_dinopet){
		const base_layer = 0;

		const context_dinopet = DOM_dinopet.getContext('2d');

		this.camera = new THREE.PerspectiveCamera(75, DOM_dinopet.width / DOM_dinopet.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 1.8);

		const orbit_controls0  = new OrbitControls(this.camera, DOM_dinopet);

		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		let pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,5);
		ambiantLight.layers.enable(base_layer);
		pointLight.layers.enable(base_layer);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.dinopet_renderer = new Renderer(dinopet_vol);
		this.dinopet_renderer.volumes.create({layer: base_layer, volume_colors: dinopet_volume_colors}).add(this.group);
		this.dinopet_renderer.volumes.rescale(0.85);

		const axis = new THREE.Vector3(0, 1, 0).normalize();
		this.clock = new Clock(true);
		this.time = 0;

		let material0 = this.dinopet_renderer.volumes.mesh.children[0].material;
		let material1 = mesh_face_material;
		this.toggle_material = function(){
			if(this.dinopet_renderer.volumes.mesh.children[0].material == material0)
				change_volumes_material(this.dinopet_renderer, material1);
			else
				change_volumes_material(this.dinopet_renderer, material0);
		}
		this.toggle_material();

		this.clipping = false;
		this.toggle_clipping = function(){
			this.clipping = !this.clipping
			if(!this.clipping){
				this.dinopet_renderer.volumes.rescale(0.85);
			}
		};
		this.loop = function(){
			if(this.running){
				if(this.clipping){
					clip_volumes(this.dinopet_renderer);
				}
				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 30 * this.time);

				this.camera.layers.enable(base_layer);
				main_renderer.setSize(DOM_dinopet.width, DOM_dinopet.height);
				main_renderer.render(this.scene, this.camera);
				context_dinopet.clearRect(0, 0, DOM_dinopet.width, DOM_dinopet.height);
				context_dinopet.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(base_layer);


				requestAnimationFrame(this.loop.bind(this));
			}
		}
	}
);