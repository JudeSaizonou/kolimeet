import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import * as THREE from 'three';

/**
 * Loaders 3D optimisés avec DRACO/KTX2 compression
 * Pour modèles GLTF/GLB ultra-performants
 */

let dracoLoader: DRACOLoader | null = null;
let ktx2Loader: KTX2Loader | null = null;

/**
 * Init DRACO loader (une seule fois)
 */
function getDRACOLoader(): DRACOLoader {
  if (!dracoLoader) {
    dracoLoader = new DRACOLoader();
    // CDN officiel Three.js pour décodeurs DRACO
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.setDecoderConfig({ type: 'js' }); // ou 'wasm' si supporté
    dracoLoader.preload();
  }
  return dracoLoader;
}

/**
 * Init KTX2 loader (une seule fois)
 */
function getKTX2Loader(renderer: THREE.WebGLRenderer): KTX2Loader {
  if (!ktx2Loader) {
    ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/basis/');
    ktx2Loader.detectSupport(renderer);
  }
  return ktx2Loader;
}

/**
 * Hook pour charger modèle GLTF avec compression
 */
export function useGLTFModel(url: string) {
  const gltf = useLoader(
    GLTFLoader,
    url,
    (loader) => {
      // Setup DRACO
      loader.setDRACOLoader(getDRACOLoader());
      
      // Setup KTX2 (nécessite accès au renderer)
      // Note: sera configuré dans le Canvas
      
      // Setup Meshopt
      loader.setMeshoptDecoder(MeshoptDecoder);
    }
  );

  return gltf;
}

/**
 * Fonction pour optimiser le modèle chargé
 */
export function optimizeModel(scene: THREE.Object3D, options: {
  castShadow?: boolean;
  receiveShadow?: boolean;
  frustumCulled?: boolean;
} = {}) {
  const {
    castShadow = false,
    receiveShadow = false,
    frustumCulled = true,
  } = options;

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Optimisations mesh
      child.castShadow = castShadow;
      child.receiveShadow = receiveShadow;
      child.frustumCulled = frustumCulled;

      // Optimisations matériaux
      if (child.material) {
        const material = child.material as THREE.Material;
        material.needsUpdate = false;

        // Si MeshStandardMaterial, optimisations supplémentaires
        if (material instanceof THREE.MeshStandardMaterial) {
          // Générer mipmaps pour textures
          if (material.map) {
            material.map.generateMipmaps = true;
            material.map.anisotropy = 4; // Raisonnable pour perf
          }

          // Désactiver features inutiles
          material.flatShading = false;
        }
      }

      // Géométrie: calculer bounding sphere pour culling
      if (child.geometry) {
        if (!child.geometry.boundingSphere) {
          child.geometry.computeBoundingSphere();
        }
      }
    }
  });

  return scene;
}

/**
 * Cleanup GPU resources
 */
export function disposeModel(scene: THREE.Object3D) {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Dispose geometry
      if (child.geometry) {
        child.geometry.dispose();
      }

      // Dispose materials
      if (child.material) {
        const materials = Array.isArray(child.material) 
          ? child.material 
          : [child.material];

        materials.forEach((material) => {
          // Dispose textures
          Object.keys(material).forEach((key) => {
            const value = (material as any)[key];
            if (value && value instanceof THREE.Texture) {
              value.dispose();
            }
          });

          // Dispose material
          material.dispose();
        });
      }
    }
  });
}

/**
 * Preload modèle (sans l'afficher)
 */
export async function preloadModel(url: string): Promise<void> {
  const loader = new GLTFLoader();
  loader.setDRACOLoader(getDRACOLoader());
  loader.setMeshoptDecoder(MeshoptDecoder);

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      () => {
        console.log(`[Preload] Model loaded: ${url}`);
        resolve();
      },
      undefined,
      (error) => {
        console.error(`[Preload] Failed to load: ${url}`, error);
        reject(error);
      }
    );
  });
}
