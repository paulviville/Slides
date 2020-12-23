import Slide from './Slide.js'
import Renderer from './CMapJS/Rendering/Renderer.js';
import Renderer_Spherical from './CMapJS/Rendering/Renderer_Spherical.js';

import * as THREE from './CMapJS/Dependencies/three.module.js';
import {OrbitControls} from './CMapJS/Dependencies/OrbitsControls.js';
import {load_graph} from './CMapJS/IO/Graph_Formats/Graph_IO.js'
import {load_cmap2} from './CMapJS/IO/Surface_Formats/CMap2_IO.js'
import {load_cmap3} from './CMapJS/IO/Volumes_Formats/CMap3_IO.js'
import * as Fertility from './Files/fertility_files.js';
import * as Vessels from './Files/vessels_files.js';
import * as Cactus from './Files/cactus_files.js';
import * as Metatron from './Files/metatron_files.js';
import * as Horse from './Files/horse_files.js';
import * as Dinopet from './Files/dinopet_files.js';
import * as Cycles from './Files/cycles_files.js';
import * as Santa from './Files/santa_files.js';
import * as Rocker_arm from './Files/rocker_arm_files.js';
import * as Mech_piece from './Files/mech_piece_files.js';
import {BoundingBox} from './CMapJS/Utils/BoundingBox.js';
import compute_scaled_jacobian from './CMapJS/Modeling/Quality/Scaled_Jacobians.js';
import {Clock} from './CMapJS/Dependencies/three.module.js';
import * as SP from './Files/sphere_partition_files.js';

import Stats from './CMapJS/Dependencies/stats.module.js'
import * as Display from './display_only.js';

let main_renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true});

let mesh_edge_color = new THREE.Color(0x333333);

let mesh_edge_material = new THREE.LineBasicMaterial({
	color: mesh_edge_color,
	linewidth: 0.5,
	polygonOffset: true,
	polygonOffsetFactor: -0.5
});

let ambiant_light_int = 0.4;
let point_light_int = 0.6;

let vessels_surface = load_graph("cg", Mech_piece.mech_piece_cg);
let bb = BoundingBox(vessels_surface.get_attribute(vessels_surface.vertex, "position"))
console.log(bb)

let stats = new Stats();
document.body.appendChild(stats.dom);


export let slide_overview = new Slide(
	function(DOM_input, DOM_output)
	{
		this.camera = new THREE.PerspectiveCamera(75, DOM_input.width / DOM_input.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 1);

		const input_layer = 0;
		const output_layer = 1;
		const skeleton_layer = 2;

		const context_input = DOM_input.getContext('2d');
		const context_output = DOM_output.getContext('2d');

		const orbit_controls_input = new OrbitControls(this.camera, DOM_input);
		const orbit_controls_output = new OrbitControls(this.camera, DOM_output);

		this.scene = new THREE.Scene()
		const ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		const pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,15);

		ambiantLight.layers.enable(input_layer);
		pointLight.layers.enable(input_layer);
		ambiantLight.layers.enable(output_layer);
		pointLight.layers.enable(output_layer);

		this.scene.add(pointLight);
		this.scene.add(ambiantLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.vessels_surface = Display.load_surface_view("off", Vessels.vessels_off, {transparent: true, opacity: 0.8});
		this.vessels_surface.layers.set(input_layer);
		this.group.add(this.vessels_surface);

		let vessels_skel = load_graph('cg', Vessels.vessels_cg);
		this.vessels_skel = new Renderer(vessels_skel);
		this.vessels_skel.edges.create({layer: skeleton_layer, material: mesh_edge_material}).add(this.group);

		this.vessels_vol = Display.load_volumes_view("mesh", Vessels.vessels_mesh);
		this.vessels_vol.layers.set(output_layer);
		this.group.add(this.vessels_vol);

		const axis = new THREE.Vector3(0, 1, 0);
		this.clock = new Clock(true);
		this.time = 0;

		this.toggle_clipping = function(){
			this.vessels_vol.material.uniforms.clipping.value = 1 - this.vessels_vol.material.uniforms.clipping.value;
		};

		this.on = 1;
		this.pause = function(){
			this.on = 1 - this.on;
		}

		this.loop = function(){
			if(this.running){
				stats.update();

				this.time += this.clock.getDelta() * this.on;
				this.group.setRotationFromAxisAngle(axis, Math.PI / 45 * this.time);

				this.vessels_surface.material.opacity = 0.8;
				this.vessels_surface.material.side = THREE.FrontSide;
				this.camera.layers.enable(skeleton_layer);
				main_renderer.setSize(DOM_input.width, DOM_input.height);
				main_renderer.render(this.scene, this.camera);
				context_input.clearRect(0, 0, DOM_input.width, DOM_input.height);
				context_input.drawImage(main_renderer.domElement, 0, 0)
				this.camera.layers.disable(skeleton_layer);

				this.vessels_surface.material.opacity = 0.3;
				this.vessels_surface.material.side = THREE.BackSide;

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


let cactus_skel = load_graph("cg", Cactus.cactus_cg);

export let slide_process_0 = new Slide(
	function(DOM_surface, DOM_skel, DOM_skel_simple){
		const surface_layer = 0;
		const skel_layer = 1;
		const skel_simple_layer = 2;

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
		pointLight.position.set(10,8,15);
		ambiantLight.layers.enable(surface_layer);
		ambiantLight.layers.enable(skel_layer);
		ambiantLight.layers.enable(skel_simple_layer);
		pointLight.layers.enable(surface_layer);
		pointLight.layers.enable(skel_layer);
		pointLight.layers.enable(skel_simple_layer);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.cactus_surface = Display.load_surface_view("off", Cactus.cactus_off, {transparent: true, opacity: 1});
		this.cactus_surface.layers.set(surface_layer);
		this.group.add(this.cactus_surface);

		this.skel_renderer = new Renderer(cactus_skel);
		this.skel_renderer.edges.create({layer: skel_layer, material: mesh_edge_material}).add(this.group);
		this.skel_renderer.vertices.create({layer: skel_layer, color: 0x00ff00, size:0.00625}).add(this.group);

		let cactus_skel_simple = load_graph("cg", Cactus.cactus_simplified_cg);
		this.skel_simple_renderer = new Renderer(cactus_skel_simple);
		this.skel_simple_renderer.edges.create({layer: skel_simple_layer, material: mesh_edge_material}).add(this.group);
		this.skel_simple_renderer.vertices.create({layer: skel_simple_layer, color: 0x00ff00, size:0.025}).add(this.group);

		const axis = new THREE.Vector3(0, 1, 0);
		this.clock = new Clock(true);
		this.time = 0;

		this.loop = function(){
			if(this.running){
				stats.update();
				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 45 * this.time);

				this.cactus_surface.material.opacity = 1;
				main_renderer.setSize(DOM_surface.width, DOM_surface.height);
				main_renderer.render(this.scene, this.camera);
				context_surface.clearRect(0, 0, DOM_surface.width, DOM_surface.height);
				context_surface.drawImage(main_renderer.domElement, 0, 0);

				this.cactus_surface.material.opacity = 0.3;
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
		pointLight.position.set(10,8,15);
		ambiantLight.layers.enable(scaffold_layer);
		ambiantLight.layers.enable(initial_mesh_layer);
		ambiantLight.layers.enable(surface_fit_mesh_layer);
		pointLight.layers.enable(scaffold_layer);
		pointLight.layers.enable(initial_mesh_layer);
		pointLight.layers.enable(surface_fit_mesh_layer);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.cactus_surface = Display.load_surface_view("off", Cactus.cactus_off, {transparent: true, opacity: 0.3});
		this.cactus_surface.layers.set(base_layer);
		this.group.add(this.cactus_surface);

		let cactus_scaffold = load_cmap2("off", Cactus.cactus_scaffold_off);
		this.scaffold_renderer = new Renderer(cactus_scaffold);
		this.scaffold_renderer.edges.create({layer: scaffold_layer, color: 0xFF0000}).add(this.group);


		let cactus_skel_simple = load_graph("cg", Cactus.cactus_simplified_cg);
		this.skel_renderer = new Renderer(cactus_skel_simple);
		this.skel_renderer.edges.create({material: mesh_edge_material}).add(this.group);
		this.skel_renderer.vertices.create({layer: scaffold_layer, color: 0x00ff00, size:0.025}).add(this.group);

		this.initial_mesh_vol = Display.load_volumes_view("mesh", Cactus.cactus0_mesh);
		this.initial_mesh_vol.layers.set(initial_mesh_layer);
		this.group.add(this.initial_mesh_vol);

		this.surface_fit_vol = Display.load_volumes_view("mesh", Cactus.cactus1_mesh);
		this.surface_fit_vol.layers.set(surface_fit_mesh_layer);
		this.group.add(this.surface_fit_vol);

		const axis = new THREE.Vector3(0, 1, 0);
		this.clock = new Clock(true);
		this.time = 0;
		this.loop = function(){
			if(this.running){
				stats.update();
				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 45 * this.time);

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
		pointLight.position.set(10,8,15);
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

		this.cactus_surface = Display.load_surface_view("off", Cactus.cactus_off, {side: THREE.BackSide, color: 0xffffff, transparent: true, opacity: 0.3});
		this.cactus_surface.layers.set(base_layer);
		this.group.add(this.cactus_surface);

		this.cactus_padding_vol = Display.load_volumes_view("mesh", Cactus.cactus_padding_mesh);
		this.cactus_padding_vol.layers.set(padding_layer);
		this.group.add(this.cactus_padding_vol);

		this.cactus_subdivided_vol = Display.load_volumes_view("mesh", Cactus.cactus_subdivided_mesh);
		this.cactus_subdivided_vol.layers.set(result_layer);
		this.group.add(this.cactus_subdivided_vol);

		this.cactus_result_vol = Display.load_volumes_view("mesh", Cactus.cactus_mesh);
		this.cactus_result_vol.layers.set(quality_layer);
		this.group.add(this.cactus_result_vol);

		this.cactus_subdivided_vol.material.uniforms.clipping.value = 1 - this.cactus_subdivided_vol.material.uniforms.clipping.value;
		this.cactus_padding_vol.material.uniforms.clipping.value = 1 - this.cactus_padding_vol.material.uniforms.clipping.value;
		this.cactus_result_vol.material.uniforms.clipping.value = 1 - this.cactus_result_vol.material.uniforms.clipping.value;


		const axis = new THREE.Vector3(0, 1, 0);
		const axisX = new THREE.Vector3(1, 0, 0);
		this.clock = new Clock(true);
		this.time = 0;
		this.rotate = Math.PI / 2;
		this.toggle_rotate = function(){
			this.cactus_padding_vol.setRotationFromAxisAngle(axisX, this.rotate);
			this.cactus_surface.setRotationFromAxisAngle(axisX, this.rotate);
			this.rotate = this.rotate != 0 ? 0 : Math.PI / 2;
		}
		
		this.toggle_material = function(){
			this.cactus_result_vol.material.uniforms.quality.value = 1 - this.cactus_result_vol.material.uniforms.quality.value;
		}

		this.loop = function(){
			if(this.running){
				stats.update();
				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 45 * this.time);

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
	});


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

		let sphere_graph = load_graph('cg', SP.branches_cg);
		let sphere_raw = load_cmap2("off", SP.delaunay_raw_off);
		let sphere_remesh = load_cmap2("off", SP.delaunay_remeshed_off);
		let sphere_dual = load_cmap2("off", SP.dual_off);


		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		let pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,15);
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
				stats.update();
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

export let slide_partition_results = new Slide(
	function(DOM_14points, DOM_fail){
		const base_layer = 0;
		const points14_layer = 1;
		const fail_layer = 2;

		const context_points3 = DOM_14points.getContext('2d');
		const context_points4 = DOM_fail.getContext('2d');

		this.camera0 = new THREE.PerspectiveCamera(75, DOM_14points.width / DOM_14points.height, 0.1, 1000.0);
		this.camera0.position.set(0, 0, 1.8);
		this.camera1 = new THREE.PerspectiveCamera(75, DOM_14points.width / DOM_14points.height, 0.1, 1000.0);
		this.camera1.position.set(0, 0, 1.8);

		this.camera0.layers.enable(base_layer);
		this.camera0.layers.enable(points14_layer);
		this.camera1.layers.enable(base_layer);
		this.camera1.layers.enable(fail_layer);

		const orbit_controls0  = new OrbitControls(this.camera0, DOM_14points);
		const orbit_controls1  = new OrbitControls(this.camera1, DOM_fail);

		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		let pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,15);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		let sphere =  new THREE.Mesh(sphere_geom, sphere_mat);
		sphere.layers.set(base_layer);
		this.group.add(sphere);

		let points14_graph = load_graph('cg', SP.partition_14_cg);
		this.points14_graph_renderer = new Renderer(points14_graph);
		this.points14_graph_renderer.edges.create({layer: points14_layer, material: mesh_edge_material}).add(this.group);

		let points14 = new THREE.Group;
		this.group.add(points14);
		let points_pos = points14_graph.get_attribute(points14_graph.vertex, "position");
		points14_graph.foreach(points14_graph.vertex, vd => {
			let point = new THREE.Mesh(point_geom, point_mat);
			point.position.copy(points_pos[points14_graph.cell(points14_graph.vertex, vd)]);
			point.layers.set(points14_layer);
			points14.add(point);
		});

		let fail_graph = load_graph('cg', SP.partition_fail_cg);
		let fail_graph_renderer = new Renderer(fail_graph);
		fail_graph_renderer.edges.create({layer: fail_layer, material: mesh_edge_material}).add(this.group);

		let points_fail = new THREE.Group;
		this.group.add(points_fail);
		points_pos = fail_graph.get_attribute(fail_graph.vertex, "position");
		fail_graph.foreach(fail_graph.vertex, vd => {
			let point = new THREE.Mesh(point_geom, point_mat);
			point.position.copy(points_pos[fail_graph.cell(fail_graph.vertex, vd)]);
			point.layers.set(fail_layer);
			points_fail.add(point);
		});


		let points14_surface = load_cmap2('off', SP.partition_14_off);
		let points14_surface_renderer = new Renderer_Spherical(points14_surface);
		points14_surface_renderer.geodesics.create({layer: points14_layer, color: 0xFF2222}).add(this.group);
		points14_surface_renderer.vertices.create({size: 0.06125, layer: points14_layer, color: 0xFF2222}).add(this.group);

		let fail_surface = load_cmap2('off', SP.partition_fail_off);
		let fail_surface_renderer = new Renderer_Spherical(fail_surface);
		fail_surface_renderer.geodesics.create({layer: fail_layer, color: 0xFF2222}).add(this.group);
		fail_surface_renderer.vertices.create({size: 0.06125, layer: fail_layer, color: 0xFF2222}).add(this.group);

		const axis = new THREE.Vector3(0, 1, 0);
		this.clock = new Clock(true);
		this.time = 0;
		this.loop = function(){
			if(this.running){
				stats.update();
				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 60 * this.time);

				main_renderer.setSize(DOM_14points.width, DOM_14points.height);
				main_renderer.render(this.scene, this.camera0);
				context_points3.clearRect(0, 0, DOM_14points.width, DOM_14points.height);
				context_points3.drawImage(main_renderer.domElement, 0, 0);

				main_renderer.render(this.scene, this.camera1);
				context_points4.clearRect(0, 0, DOM_fail.width, DOM_fail.height);
				context_points4.drawImage(main_renderer.domElement, 0, 0);

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
		pointLight.position.set(10,8,15);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		let sphere =  new THREE.Mesh(sphere_geom, sphere_mat);
		sphere.layers.set(base_layer);
		this.group.add(sphere);

		let flat_3_graph = load_graph('cg', SP.flat_3_cg);
		let flat3_graph_renderer = new Renderer(flat_3_graph);
		flat3_graph_renderer.edges.create({layer: points3_layer, material: mesh_edge_material}).add(this.group);

		let points3 = new THREE.Group;
		this.group.add(points3);
		let points_pos = flat_3_graph.get_attribute(flat_3_graph.vertex, "position");
		flat_3_graph.foreach(flat_3_graph.vertex, vd => {
			let point = new THREE.Mesh(point_geom, point_mat);
			point.position.copy(points_pos[flat_3_graph.cell(flat_3_graph.vertex, vd)]);
			point.layers.set(points3_layer);
			points3.add(point);
		});

		let flat_4_graph = load_graph('cg', SP.flat_4_cg);
		let flat4_graph_renderer = new Renderer(flat_4_graph);
		flat4_graph_renderer.edges.create({layer: points4_layer, material: mesh_edge_material}).add(this.group);

		let points4 = new THREE.Group;
		this.group.add(points4);
		points_pos = flat_4_graph.get_attribute(flat_4_graph.vertex, "position");
		flat_4_graph.foreach(flat_4_graph.vertex, vd => {
			let point = new THREE.Mesh(point_geom, point_mat);
			point.position.copy(points_pos[flat_4_graph.cell(flat_4_graph.vertex, vd)]);
			point.layers.set(points4_layer);
			points4.add(point);
		});

		let flat_5_graph = load_graph('cg', SP.flat_5_cg);
		let flat5_graph_renderer = new Renderer(flat_5_graph);
		flat5_graph_renderer.edges.create({layer: points5_layer, material: mesh_edge_material}).add(this.group);

		let points5 = new THREE.Group;
		this.group.add(points5);
		points_pos = flat_5_graph.get_attribute(flat_5_graph.vertex, "position");
		flat_5_graph.foreach(flat_5_graph.vertex, vd => {
			let point = new THREE.Mesh(point_geom, point_mat);
			point.position.copy(points_pos[flat_5_graph.cell(flat_5_graph.vertex, vd)]);
			point.layers.set(points5_layer);
			points5.add(point);
		});

		let flat_3_surface = load_cmap2('off', SP.flat_3_off);
		let flat3_surface_renderer = new Renderer_Spherical(flat_3_surface);
		flat3_surface_renderer.geodesics.create({layer: points3_layer, color: 0xFF2222}).add(this.group);
		flat3_surface_renderer.vertices.create({size: 0.06125, layer: points3_layer, color: 0xFF2222}).add(this.group);

		let flat_4_surface = load_cmap2('off', SP.flat_4_off);
		let flat4_surface_renderer = new Renderer_Spherical(flat_4_surface);
		flat4_surface_renderer.geodesics.create({layer: points4_layer, color: 0xFF2222}).add(this.group);
		flat4_surface_renderer.vertices.create({size: 0.06125, layer: points4_layer, color: 0xFF2222}).add(this.group);

		let flat_5_surface = load_cmap2('off', SP.flat_5_off);
		let flat5_surface_renderer = new Renderer_Spherical(flat_5_surface);
		flat5_surface_renderer.geodesics.create({layer: points5_layer, color: 0xFF2222}).add(this.group);
		flat5_surface_renderer.vertices.create({size: 0.06125, layer: points5_layer, color: 0xFF2222}).add(this.group);

		const axis = new THREE.Vector3(0, 1, 0);
		this.clock = new Clock(true);
		this.time = 0;
		this.loop = function(){
			if(this.running){
				stats.update();
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
		pointLight.position.set(10,8,15);
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




		let ortho_3_surface = load_cmap2('off', SP.ortho_3_off);
		let ortho3_surface_renderer = new Renderer_Spherical(ortho_3_surface);
		ortho3_surface_renderer.geodesics.create({layer: points3_layer, color: 0xFF2222}).add(this.group);
		ortho3_surface_renderer.vertices.create({size: 0.06125, layer: points3_layer, color: 0xFF2222}).add(this.group);

		let ortho_3_graph = load_graph('cg', SP.ortho_3_cg);
		let ortho3_graph_renderer = new Renderer(ortho_3_graph);
		ortho3_graph_renderer.edges.create({layer: points3_layer, material: mesh_edge_material}).add(this.group);

		let points_pos = ortho_3_graph.get_attribute(ortho_3_graph.vertex, "position");
		let points3 = new THREE.Group;
		this.group.add(points3);
		ortho_3_graph.foreach(ortho_3_graph.vertex, vd => {
			let point = new THREE.Mesh(point_geom, point_mat);
			point.position.copy(points_pos[ortho_3_graph.cell(ortho_3_graph.vertex, vd)]);
			point.layers.set(points3_layer);
			points3.add(point);
		});

		let ortho_4_surface = load_cmap2('off', SP.ortho_4_off);
		let ortho4_surface_renderer = new Renderer_Spherical(ortho_4_surface);
		ortho4_surface_renderer.geodesics.create({layer: points4_layer, color: 0xFF2222}).add(this.group);
		ortho4_surface_renderer.vertices.create({size: 0.06125, layer: points4_layer, color: 0xFF2222}).add(this.group);

		let ortho_4_graph = load_graph('cg', SP.ortho_4_cg);
		let ortho4_graph_renderer = new Renderer(ortho_4_graph);
		ortho4_graph_renderer.edges.create({layer: points4_layer, material: mesh_edge_material}).add(this.group);

		let points4 = new THREE.Group;
		this.group.add(points4);
		points_pos = ortho_4_graph.get_attribute(ortho_4_graph.vertex, "position");
		ortho_4_graph.foreach(ortho_4_graph.vertex, vd => {
			let point = new THREE.Mesh(point_geom, point_mat);
			point.position.copy(points_pos[ortho_4_graph.cell(ortho_4_graph.vertex, vd)]);
			point.layers.set(points4_layer);
			points4.add(point);
		});


		let ortho_5_surface = load_cmap2('off', SP.ortho_5_off);
		let ortho5_surface_renderer = new Renderer_Spherical(ortho_5_surface);
		ortho5_surface_renderer.geodesics.create({layer: points5_layer, color: 0xFF2222}).add(this.group);
		ortho5_surface_renderer.vertices.create({size: 0.06125, layer: points5_layer, color: 0xFF2222}).add(this.group);

		let ortho_5_graph = load_graph('cg', SP.ortho_5_cg);
		let ortho5_graph_renderer = new Renderer(ortho_5_graph);
		ortho5_graph_renderer.edges.create({layer: points5_layer, material: mesh_edge_material}).add(this.group);

		let points5 = new THREE.Group;
		this.group.add(points5);
		points_pos = ortho_5_graph.get_attribute(ortho_5_graph.vertex, "position");
		ortho_5_graph.foreach(ortho_5_graph.vertex, vd => {
			let point = new THREE.Mesh(point_geom, point_mat);
			point.position.copy(points_pos[ortho_5_graph.cell(ortho_5_graph.vertex, vd)]);
			point.layers.set(points5_layer);
			points5.add(point);
		});



		const axis = new THREE.Vector3(0.3, 0.7, 0).normalize();
		this.clock = new Clock(true);
		this.time = 0;
		this.loop = function(){
			if(this.running){
				stats.update();
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
		pointLight.position.set(10,8,15);
		ambiantLight.layers.enable(livesu_layer);
		pointLight.layers.enable(livesu_layer);
		ambiantLight.layers.enable(our_layer);
		pointLight.layers.enable(our_layer);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.metatron_liv_vol = Display.load_volumes_view("mesh", Metatron.metatron_liv_mesh);
		this.metatron_liv_vol.layers.set(livesu_layer);
		this.group.add(this.metatron_liv_vol);

		this.metatron_vol = Display.load_volumes_view("mesh", Metatron.metatron_mesh);
		this.metatron_vol.layers.set(our_layer);
		this.group.add(this.metatron_vol);

		this.metatron_liv_vol.material.uniforms.min_clipping.value = -0.1;
		this.metatron_vol.material.uniforms.min_clipping.value = -0.1;

		const axis = new THREE.Vector3(0.3, 0.7, 0).normalize();
		this.clock = new Clock(true);
		this.time = 0;
		this.clipping = false;
		this.toggle_clipping = function(){
			this.metatron_liv_vol.material.uniforms.clipping.value = 1 - this.metatron_liv_vol.material.uniforms.clipping.value;
			this.metatron_vol.material.uniforms.clipping.value = 1 - this.metatron_vol.material.uniforms.clipping.value;
		};
		this.loop = function(){
			if(this.running){
				stats.update();

				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 45 * this.time);

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

export let slide_santa_comparison = new Slide(
	function(DOM_livesu, DOM_ours){
		const livesu_layer = 0;
		const our_layer = 1;

		const context_livesu = DOM_livesu.getContext('2d');
		const context_ours = DOM_ours.getContext('2d');

		this.camera = new THREE.PerspectiveCamera(75, DOM_livesu.width / DOM_livesu.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 1);

		const orbit_controls0  = new OrbitControls(this.camera, DOM_livesu);
		const orbit_controls1  = new OrbitControls(this.camera, DOM_ours);

		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		let pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,15);
		ambiantLight.layers.enable(livesu_layer);
		pointLight.layers.enable(livesu_layer);
		ambiantLight.layers.enable(our_layer);
		pointLight.layers.enable(our_layer);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.santa_liv_vol = Display.load_volumes_view("mesh", Santa.santa_liv_mesh);
		this.santa_liv_vol.layers.set(livesu_layer);
		this.group.add(this.santa_liv_vol);

		this.santa_vol = Display.load_volumes_view("mesh", Santa.santa_mesh);
		this.santa_vol.layers.set(our_layer);
		this.group.add(this.santa_vol);

		this.santa_liv_vol.material.uniforms.min_clipping.value = -0.05;
		this.santa_vol.material.uniforms.min_clipping.value = -0.05;

		const axis = new THREE.Vector3(0, 1, 0).normalize();
		this.clock = new Clock(true);
		this.time = 0;
		this.clipping = false;
		this.toggle_clipping = function(){
			this.santa_liv_vol.material.uniforms.quality.value = 1 - this.santa_liv_vol.material.uniforms.quality.value;
			this.santa_vol.material.uniforms.quality.value = 1 - this.santa_vol.material.uniforms.quality.value;
		};
		this.loop = function(){
			if(this.running){
				stats.update();

				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 180 * this.time);

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
		pointLight.position.set(10,8,15);
		ambiantLight.layers.enable(base_layer);
		pointLight.layers.enable(base_layer);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.fertility_surface = Display.load_surface_view("off", Fertility.fertility_off, {color: 0xffffff, side: THREE.BackSide, transparent: true, opacity: 0.3});
		this.fertility_surface.layers.set(base_layer);
		this.group.add(this.fertility_surface);

		this.fertility_vol = Display.load_volumes_view("mesh", Fertility.fertility_mesh);
		this.fertility_vol.layers.set(base_layer);
		this.group.add(this.fertility_vol);

		const axis = new THREE.Vector3(0, 1, 0).normalize();
		this.clock = new Clock(true);
		this.time = 0;

		this.toggle_clipping = function(){
			this.fertility_vol.material.uniforms.clipping.value = 1 - this.fertility_vol.material.uniforms.clipping.value;

		}

		this.clipping = false;
		this.toggle_material = function(){
				this.fertility_vol.material.uniforms.quality.value = 1 - this.fertility_vol.material.uniforms.quality.value;

		};
		this.loop = function(){
			if(this.running){
				stats.update();
				if(this.clipping){
					clip_volumes(this.fertility_renderer);
				}
				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 45 * this.time);

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
		pointLight.position.set(10,8,15);
		ambiantLight.layers.enable(base_layer);
		pointLight.layers.enable(base_layer);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.dinopet_surface = Display.load_surface_view("off", Dinopet.dinopet_off, {color: 0xffffff, side: THREE.BackSide, transparent: true, opacity: 0.3});
		this.dinopet_surface.layers.set(base_layer);
		this.group.add(this.dinopet_surface);

		
		this.dinopet_vol = Display.load_volumes_view("mesh", Dinopet.dinopet_mesh);
		this.dinopet_vol.layers.set(base_layer);
		this.group.add(this.dinopet_vol);

		const axis = new THREE.Vector3(0, 1, 0).normalize();
		this.clock = new Clock(true);
		this.time = 0;

		this.toggle_clipping = function(){
			this.dinopet_vol.material.uniforms.clipping.value = 1 - this.dinopet_vol.material.uniforms.clipping.value;
		}

		this.clipping = false;
		this.toggle_material = function(){
			this.dinopet_vol.material.uniforms.quality.value = 1 - this.dinopet_vol.material.uniforms.quality.value;
		};
		this.loop = function(){
			if(this.running){
				stats.update();

				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 45 * this.time);

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

export let slide_horse_result = new Slide(
	function(DOM_horse){
		const base_layer = 0;

		const context_horse = DOM_horse.getContext('2d');

		this.camera = new THREE.PerspectiveCamera(75, DOM_horse.width / DOM_horse.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 1);

		const orbit_controls0  = new OrbitControls(this.camera, DOM_horse);

		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		let pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,15);
		ambiantLight.layers.enable(base_layer);
		pointLight.layers.enable(base_layer);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.horse_surface = Display.load_surface_view("off", Horse.horse_off, {color: 0xffffff, side: THREE.BackSide, transparent: true, opacity: 0.3});
		this.horse_surface.layers.set(base_layer);
		this.group.add(this.horse_surface);

		this.horse_vol = Display.load_volumes_view("mesh", Horse.horse_mesh);
		this.horse_vol.layers.set(base_layer);
		this.group.add(this.horse_vol);

		const axis = new THREE.Vector3(0, 1, 0).normalize();
		this.clock = new Clock(true);
		this.time = 0;

		this.toggle_clipping = function(){
			this.horse_vol.material.uniforms.clipping.value = 1 - this.horse_vol.material.uniforms.clipping.value;
		}

		this.clipping = false;
		this.toggle_material = function(){
			this.horse_vol.material.uniforms.quality.value = 1 - this.horse_vol.material.uniforms.quality.value;
		};
		this.loop = function(){
			if(this.running){
				stats.update();

				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis,  Math.PI/2 + Math.PI / 45 * this.time);

				this.camera.layers.enable(base_layer);
				main_renderer.setSize(DOM_horse.width, DOM_horse.height);
				main_renderer.render(this.scene, this.camera);
				context_horse.clearRect(0, 0, DOM_horse.width, DOM_horse.height);
				context_horse.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(base_layer);


				requestAnimationFrame(this.loop.bind(this));
			}
		}
	}
);

export let slide_cycles_result = new Slide(
	function(DOM_cycles){
		const base_layer = 0;

		const context_cycles = DOM_cycles.getContext('2d');

		this.camera = new THREE.PerspectiveCamera(75, DOM_cycles.width / DOM_cycles.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 6);

		const orbit_controls0  = new OrbitControls(this.camera, DOM_cycles);

		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		let pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,15);
		ambiantLight.layers.enable(base_layer);
		pointLight.layers.enable(base_layer);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.cycles_surface = Display.load_surface_view("off", Cycles.cycles_off, {color: 0xffffff, side: THREE.BackSide, transparent: true, opacity: 0.3});
		this.cycles_surface.layers.set(base_layer);
		this.group.add(this.cycles_surface);

		this.cycles_vol = Display.load_volumes_view("mesh", Cycles.cycles_mesh);
		this.cycles_vol.layers.set(base_layer);
		this.group.add(this.cycles_vol);

		const axis = new THREE.Vector3(0, 1, 0).normalize();
		this.clock = new Clock(true);
		this.time = 0;

		this.toggle_clipping = function(){
			this.cycles_vol.material.uniforms.clipping.value = 1 - this.cycles_vol.material.uniforms.clipping.value;
		}

		this.clipping = false;
		this.toggle_material = function(){
			this.cycles_vol.material.uniforms.quality.value = 1 - this.cycles_vol.material.uniforms.quality.value;
		};
		this.loop = function(){
			if(this.running){
				stats.update();

				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis,  Math.PI/2 + Math.PI / 45 * this.time);

				this.camera.layers.enable(base_layer);
				main_renderer.setSize(DOM_cycles.width, DOM_cycles.height);
				main_renderer.render(this.scene, this.camera);
				context_cycles.clearRect(0, 0, DOM_cycles.width, DOM_cycles.height);
				context_cycles.drawImage(main_renderer.domElement, 0, 0);
				this.camera.layers.disable(base_layer);

				requestAnimationFrame(this.loop.bind(this));
			}
		}
	}
);

export let slide_edge_cases = new Slide(
	function(DOM_rocker, DOM_mech){
		const rocker_layer = 0;
		const mech_layer = 1;

		const context_rocker = DOM_rocker.getContext('2d');
		const context_mech = DOM_mech.getContext('2d');

		this.camera0 = new THREE.PerspectiveCamera(75, DOM_rocker.width / DOM_rocker.height, 0.1, 1000.0);
		this.camera0.position.set(0, 0, 2.5);

		this.camera1 = new THREE.PerspectiveCamera(75, DOM_rocker.width / DOM_rocker.height, 0.1, 1000.0);
		this.camera1.position.set(0, 0, 2);
		this.camera1.layers.enable(mech_layer);
		this.camera1.layers.disable(rocker_layer);

		const orbit_controls0  = new OrbitControls(this.camera0, DOM_rocker);
		const orbit_controls1  = new OrbitControls(this.camera1, DOM_mech);

		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiant_light_int);
		let pointLight = new THREE.PointLight(0xFFFFFF, point_light_int);
		pointLight.position.set(10,8,15);
		ambiantLight.layers.enable(rocker_layer);
		pointLight.layers.enable(rocker_layer);
		ambiantLight.layers.enable(mech_layer);
		pointLight.layers.enable(mech_layer);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.rocker_surface = Display.load_surface_view("off", Rocker_arm.rocker_arm_off, {transparent: true, opacity: 0.3});
		this.rocker_surface.layers.set(rocker_layer);
		this.group.add(this.rocker_surface);

		let rocker_skel = load_graph('cg', Rocker_arm.rocker_arm_cg);
		this.rocker_skel = new Renderer(rocker_skel);
		this.rocker_skel.edges.create({layer: rocker_layer, material: mesh_edge_material}).add(this.group);
		this.rocker_skel.edges.mesh.visible = false;

		this.rocker_vol = Display.load_volumes_view("mesh", Rocker_arm.rocker_arm_mesh);
		this.rocker_vol.layers.set(rocker_layer);
		this.rocker_vol.visible = false;
		this.group.add(this.rocker_vol);

		this.mech_surface = Display.load_surface_view("off", Mech_piece.mech_piece_off, {transparent: true, opacity: 0.3});
		this.mech_surface.layers.set(mech_layer);
		this.group.add(this.mech_surface);

		this.mech_vol = Display.load_volumes_view("mesh", Mech_piece.mech_piece_mesh);
		this.mech_vol.layers.set(mech_layer);
		this.group.add(this.mech_vol);
		this.mech_vol.visible = false;

		let mech_skel = load_graph("cg", Mech_piece.mech_piece_cg);
		this.mech_skel = new Renderer(mech_skel);
		this.mech_skel.edges.create({layer: mech_layer, material: mesh_edge_material}).add(this.group);
		this.mech_skel.edges.mesh.visible = false;

		const axis = new THREE.Vector3(0, 1, 0).normalize();
		this.clock = new Clock(true);
		this.time = 0;

		this.toggle_rocker_skel = function(){
			this.rocker_skel.edges.mesh.visible = !this.rocker_skel.edges.mesh.visible;
		}

		this.toggle_mech_skel = function(){
			this.mech_skel.edges.mesh.visible = !this.mech_skel.edges.mesh.visible;
		}

		this.toggle_rocker_vol = function(){
			this.rocker_vol.visible = !this.rocker_vol.visible;
			this.rocker_surface.material.side = 
				this.rocker_surface.material.side == THREE.BackSide ?
					THREE.FrontSide : THREE.BackSide;
		}

		this.toggle_mech_vol = function(){
			this.mech_vol.visible = !this.mech_vol.visible;
			this.mech_surface.material.side = 
				this.mech_surface.material.side == THREE.BackSide ?
					THREE.FrontSide : THREE.BackSide;
		}

		this.toggle_mech_vol_clip = function(){
			this.mech_vol.material.uniforms.clipping.value = 1 - this.mech_vol.material.uniforms.clipping.value;
			this.mech_vol.material.uniforms.quality.value = 1 - this.mech_vol.material.uniforms.quality.value;
		}

		this.toggle_rocker_vol_clip = function(){
			this.rocker_vol.material.uniforms.clipping.value = 1 - this.rocker_vol.material.uniforms.clipping.value;
			this.rocker_vol.material.uniforms.quality.value = 1 - this.rocker_vol.material.uniforms.quality.value;
		}

		this.loop = function(){
			if(this.running){
				stats.update();

				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 180 * this.time);

				main_renderer.setSize(DOM_rocker.width, DOM_rocker.height);
				main_renderer.render(this.scene, this.camera0);
				context_rocker.clearRect(0, 0, DOM_rocker.width, DOM_rocker.height);
				context_rocker.drawImage(main_renderer.domElement, 0, 0);

				main_renderer.render(this.scene, this.camera1);
				context_mech.clearRect(0, 0, DOM_mech.width, DOM_mech.height);
				context_mech.drawImage(main_renderer.domElement, 0, 0);

				requestAnimationFrame(this.loop.bind(this));
			}
		}
	}
);
