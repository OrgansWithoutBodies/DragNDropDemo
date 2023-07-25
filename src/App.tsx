import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Outline } from "@react-three/postprocessing";
import React, { createRef, useEffect, useRef, useState } from "react";
import {
  BufferGeometry,
  Mesh,
  PerspectiveCamera,
  Quaternion,
  Scene,
  SphereGeometry,
  Vector3,
} from "three";

import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { dataService } from "./data/data.service";
import {
  DraggableGeometry,
  DroppableID,
  ObjV3,
  PlacedID,
} from "./data/data.store";
import { useData } from "./data/useAkita";
function BaseMeshImpl(
  {
    dragging,
    onDragMove,
  }: {
    dragging: boolean;
    onDragMove: (pos: ObjV3, normal: ObjV3) => void;
  },
  ref: React.Ref<Mesh>
): JSX.Element {
  return (
    <mesh
      name={"BASE"}
      ref={ref}
      onPointerMove={(event) => {
        if (dragging) {
          onDragMove(
            event.intersections[0].point,
            event.intersections[0].face!.normal
          );
        }
      }}
    >
      <primitive attach="geometry" object={new SphereGeometry(1)} />

      <meshStandardMaterial color={"white"} />
    </mesh>
  );
}
const BaseMesh = React.forwardRef(BaseMeshImpl);
function DraggableElement({
  color,
  onDragStart,
  geometry: implicitGeometry,
}: Draggable & DraggableGeometry<false>) {
  const geometry = implicitGeometry();
  // const hoveringObject = false;
  const ref = useRef();
  const [hoveringObject, setHoveringObject] = useState<boolean>(false);
  console.log("hover", hoveringObject);
  return (
    <group>
      <EffectComposer enabled={hoveringObject} autoClear={false}>
        <Outline
          hiddenEdgeColor={0xffffff}
          edgeStrength={100}
          selection={hoveringObject ? ref.current : undefined}
        />
      </EffectComposer>
      <mesh
        ref={ref}
        onPointerDown={onDragStart}
        // makes the geometry freak out for some reason
        onPointerLeave={() => setHoveringObject(false)}
        onPointerEnter={() => setHoveringObject(true)}
      >
        <primitive attach="geometry" object={geometry} />
        <meshStandardMaterial color={color} />
        {/* <meshStandardMaterial color={hoveringObject ? "cyan" : color} /> */}
      </mesh>
    </group>
  );
}
type Draggable = {
  color: string;
  onDragStart: () => void;
};

function draggableIsLoadedGuard(
  draggable: DraggableGeometry
): draggable is DraggableGeometry<false> {
  return "geometry" in draggable;
}
function App() {
  const [dragging, setDragging] = useState<PlacedID | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const cameraRef = createRef<PerspectiveCamera>();
  const canvasContainerRef = createRef<HTMLDivElement>();
  const boxRef = createRef<Mesh>();

  const [{ droppableEntities, placedEntities, activeColor }] = useData([
    "droppableEntities",
    "activeColor",
    "placedEntities",
  ]);
  useEffect(() => {
    void dataService.loadAsyncModels();
  }, []);
  const DraggableAdapter =
    ({ key }: { key: keyof typeof droppableEntities }) =>
    ({ color, onDragStart }: Draggable) => {
      const droppable = droppableEntities[key];
      return draggableIsLoadedGuard(droppable) ? (
        <DraggableElement
          color={color}
          onDragStart={onDragStart}
          geometry={droppable.geometry}
        />
      ) : (
        <></>
      );
    };

  function CanvasContents({ setScene }: { setScene: (scene: Scene) => void }) {
    const { scene: localScene } = useThree();
    setScene(localScene);
    return (
      <>
        <perspectiveCamera ref={cameraRef} />

        <ambientLight intensity={0.25} />
        <directionalLight
          color="#ffccaa"
          intensity={0.5}
          position={[-1, 2, 4]}
        />
        <directionalLight
          color="#aaccff"
          intensity={0.5}
          position={[1, 2, 4]}
        />
        <BaseMesh
          ref={boxRef}
          dragging={dragging !== null}
          onDragMove={(pos, normal) => {
            dataService.updateEntityPosition(dragging!, { pos, normal });
          }}
        />
        {placedEntities &&
          Object.values(placedEntities).map((args) => {
            if (args !== null) {
              const {
                color,
                pos,
                normal,
                droppable: { id },
              } = args;
              if (pos === null || normal === null) {
                return <></>;
              }
              const Draggable = DraggableAdapter({
                key: id,
              });
              return (
                <group
                  position={new Vector3(pos.x, pos.y, pos.z)}
                  quaternion={new Quaternion().setFromUnitVectors(
                    new Vector3(0, 1, 0),
                    new Vector3(normal.x, normal.y, normal.z).normalize()
                  )}
                >
                  <Draggable
                    color={color}
                    onDragStart={() => setDragging(args.placedEntityId)}
                  />
                </group>
              );
            }
            return <></>;
          })}
        <OrbitControls enableRotate={dragging === null} />
      </>
    );
  }
  const colors: { color: string }[] = [
    { color: "red" },
    { color: "green" },
    { color: "yellow" },
    { color: "blue" },
    { color: "purple" },
    { color: "pink" },
  ];
  return (
    <div>
      <div
        onMouseUp={() => setDragging(null)}
        style={{
          display: "flex",
          flexDirection: "row",
          cursor: dragging !== null ? "grab" : "initial",
        }}
      >
        <div>
          {colors.map((item) => {
            return (
              <div
                onMouseDown={() => {
                  dataService.setActiveColor(item.color);
                }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 20,
                  strokeWidth: 20,
                  stroke: "black",
                  strokeOpacity: 1,
                  backgroundColor: item.color,
                }}
              ></div>
            );
          })}
        </div>
        <div style={{ width: 800, height: 800 }} ref={canvasContainerRef}>
          <Canvas
            style={{ background: "black" }}
            // onMouseMove={(event) => {
            //   if (dragging !== null) {
            //     const raycaster = new Raycaster();
            //     const pointerPos = [
            //       (event.clientX / canvasContainerRef.current!.clientWidth) * 2 -
            //         1,
            //       -(event.clientY / canvasContainerRef.current!.clientHeight) *
            //         2 +
            //         1,
            //     ];
            //     // const pointerPos = [event.clientX, event.clientY];
            //     raycaster.setFromCamera(
            //       new Vector2(...pointerPos),
            //       cameraRef.current as PerspectiveCamera
            //     );
            //     const intersects = raycaster.intersectObjects([boxRef.current!]);
            //     if (intersects.length > 0) {
            //     }
            //   }
            // }}
            color="black"
          >
            <CanvasContents setScene={setScene} />
          </Canvas>
        </div>
        <div>
          {droppableEntities &&
            Object.keys(droppableEntities).map((droppableKey) => {
              return DroppableCompponent(droppableKey as DroppableID);
            })}
        </div>
      </div>
      <button
        style={{
          width: 200,
          height: 80,
          backgroundColor: "green",
          fontSize: 20,
        }}
        onClick={() => {
          const exporter = new GLTFExporter();
          exporter.parse(
            scene!,
            (gltf) => {
              saveArrayBuffer(JSON.stringify(gltf), "demo.gltf");
            },
            () => {
              throw new Error("Something went wrong while exporting scene!");
            }
          );
        }}
      >
        EXPORT AS GLTF
      </button>

      <div>
        Features:
        <p />- Drag and drop any arbitrary combination from RHS menu onto canvas
        <p />- Change colors for next mesh dropped onto canvas
        <p />- RHS can have any number of arbitrary mesh objects
        <p />- Export current scene to GLTF
        <p />- Orbit RHS object on hover
        <p />- Automatically orient object to align with base normal
        <p />- Import arbitrary GLTF as RHS source object (teapot is gltf)
      </div>
      <div>
        Future plans for improvement:
        <p />
        - can drag object when is hidden (would need custom raycaster, not too
        hard)
        <p />
        - no interface to change color of currently selected object, can only
        change color for new objects (easy, just proof of concept - not sure
        spec for colorability yet - in video, color gets applied to all objects)
        <p />
        - scene colors washed out (easy, sRGB correction)
        <p />- Camera controls Gimbal Lock (less easy, needs to investigate
        intuitive quaternion-based camera controls - not 100% necessary but
        nice)
        <p />- Currently no way of deleting objects (easy, just need to
        implement selection mode)
        <p />- No control gizmos for reorienting placed objects (functionally
        easy, deciding on how gizmo should look is harder)
        <p />- Mesh doesnt change colors when mouse hovers over it (have the
        code for it but rn theres a weird rendering bug when I do, didn't think
        worth investigating)
        <p />- Can only add on to base mesh (unclear if adding onto whole mesh
        is within desired scope, slightly challenging not impossible - raises
        question of what to do w a mesh if the mesh it's 'pasted' onto is
        removed)
        <p /> Each mesh currently solid color, can make mesh have
        texture/multiple color slots
        <p /> Animated Components
        <p /> Make code cleaner - just aiming for functional demo instead of
        PR-worthy code. Think this pattern is a great basis for further
        extensibility tho
        <p /> Components Category
        <p /> Surround component with "Glow" effect when selected (Threejs has a
        built in compositor which makes this pretty easy)
        <p /> "Price" system per-object giving intrinsic limit to how many
        objects user can limit, model for profitability
        <p />
      </div>
    </div>
  );

  function DroppableCompponent(droppableKey: DroppableID) {
    const droppable = droppableEntities[droppableKey];
    const geometry = "geometry" in droppable ? droppable.geometry() : null;
    return (
      <div
        style={{ width: 100, height: 100 }}
        onMouseDown={() => {
          const placementID = dataService.addDroppable(droppableKey);
          setDragging(placementID);
        }}
      >
        <Canvas style={{ background: "black" }} camera={{ zoom: 10 }}>
          {geometry && (
            <DraggableScene geometry={geometry} activeColor={activeColor} />
          )}
        </Canvas>
      </div>
    );
  }
}

export function DraggableScene({
  geometry,
  activeColor,
}: {
  geometry: BufferGeometry;
  activeColor: string;
}): JSX.Element {
  const objRef = useRef<BufferGeometry>();
  const [hovering, setHovering] = useState<boolean>(false);
  const { scene } = useThree();
  useFrame((state, delta) => {
    if (hovering) {
      const angle = delta * 7;
      objRef.current!.rotateX(angle / 3);
      objRef.current!.rotateY(angle / 5);
      objRef.current!.rotateZ(angle / 7);
      state.invalidate();
    }
  });
  return (
    <mesh
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
    >
      <directionalLight color="#ffffff" intensity={0.7} position={[-1, 2, 4]} />
      <ambientLight />
      <primitive ref={objRef} object={geometry.clone()} attach="geometry" />
      <meshStandardMaterial color={activeColor} />
    </mesh>
  );
}

export default App;

function saveArrayBuffer(buffer: BlobPart, filename: string) {
  save(new Blob([buffer], { type: "application/octet-stream" }), filename);
}

function save(blob: Blob, filename: string) {
  const link = document.createElement("a");
  link.style.display = "none";
  document.body.appendChild(link); // Firefox workaround, see #6594
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();

  // URL.revokeObjectURL( url ); breaks Firefox...
}
