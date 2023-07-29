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
          const baseObj = event.intersections.find(
            (obj) => obj.object.name === "BASE"
          );
          if (baseObj) {
            onDragMove(baseObj.point, baseObj.face!.normal);
          }
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
  isSelected,
  dragging,
  onSelect,
}: Draggable & {
  isSelected: boolean;
  dragging: boolean;
} & DraggableGeometry<false>) {
  const geometry = implicitGeometry();
  // const hoveringObject = false;
  const ref = useRef<Mesh | null>(null);
  const [mouseDown, setMouseDown] = useState<boolean>(false);
  const [hoveringObject, setHoveringObject] = useState<boolean>(false);
  return (
    <group>
      <EffectComposer enabled={hoveringObject} autoClear={false}>
        {hoveringObject ? (
          <Outline
            hiddenEdgeColor={0x22ffff}
            visibleEdgeColor={0x22ffff}
            edgeStrength={100}
            selection={ref.current || undefined}
          />
        ) : (
          <></>
        )}

        {/* {isSelected ? (
          <Outline
            hiddenEdgeColor={0xffff00}
            visibleEdgeColor={0xffff00}
            edgeStrength={10000}
            selection={ref.current}
          />
        ) : (
          <></>
        )} */}
      </EffectComposer>
      <mesh
        ref={ref}
        onPointerDown={() => setMouseDown(true)}
        onPointerMove={() => {
          // TODO terrible pattern in lieu of state machine
          if (mouseDown || dragging) {
            onDragStart();
            setMouseDown(false);
          }
        }}
        onPointerUp={() => {
          if (mouseDown && !dragging) {
            setMouseDown(false);
            onSelect(!isSelected);
          }
        }}
        // makes the geometry freak out for some reason
        onPointerLeave={() => setHoveringObject(false)}
        onPointerEnter={() => {
          if (dragging) {
            return;
          }
          setHoveringObject(true);
        }}
      >
        <primitive attach="geometry" object={geometry} />
        <meshStandardMaterial color={!isSelected ? color : "cyan"} />
        {/* <meshStandardMaterial color={hoveringObject ? "cyan" : color} /> */}
      </mesh>
    </group>
  );
}
type Draggable = {
  color: string;
  onDragStart: () => void;
  onSelect: (val: boolean) => void;
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
  // const [current, send] = useMachine(DragNDropMachine);

  const [
    { droppableEntities, placedEntities, activeColor, selectedPlacedEntity },
  ] = useData([
    "droppableEntities",
    "activeColor",
    "placedEntities",
    "selectedPlacedEntity",
  ]);
  useEffect(() => {
    void dataService.loadAsyncModels();
  }, []);
  const DraggableAdapter =
    ({ key, placeableID }: { key: DroppableID; placeableID: PlacedID }) =>
    ({ color, onDragStart, onSelect }: Draggable) => {
      const droppable = droppableEntities[key];
      return draggableIsLoadedGuard(droppable) ? (
        <DraggableElement
          color={color}
          dragging={dragging === placeableID}
          onDragStart={onDragStart}
          geometry={droppable.geometry}
          isSelected={selectedPlacedEntity === placeableID}
          onSelect={onSelect}
        />
      ) : (
        <></>
      );
    };

  function CanvasContents({ setScene }: { setScene: (scene: Scene) => void }) {
    const { scene: localScene, invalidate } = useThree();
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
                placedEntityId,
                pos,
                normal,
                droppable: { id },
              } = args;
              if (pos === null || normal === null) {
                return <></>;
              }
              const Draggable = DraggableAdapter({
                key: id,
                placeableID: placedEntityId,
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
                    onDragStart={() => setDragging(placedEntityId)}
                    onSelect={(val) => {
                      if (val === true) {
                        dataService.setSelected(placedEntityId);
                      } else {
                        dataService.setSelected(null);
                      }
                      invalidate();
                    }}
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
                  outlineWidth: 5,
                  outlineOffset: -7,
                  outlineStyle: "solid",
                  outlineColor: activeColor === item.color ? "white" : "black",
                  backgroundColor: item.color,
                }}
              ></div>
            );
          })}
        </div>
        <div style={{ width: 800, height: 800 }} ref={canvasContainerRef}>
          <Canvas
            onPointerUp={() => setDragging(null)}
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
      <div style={{ display: "flex", flexDirection: "row" }}>
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
        <button
          style={{
            width: 200,
            height: 80,
            backgroundColor: "red",
            fontSize: 20,
          }}
          onClick={() => {
            if (selectedPlacedEntity !== null) {
              dataService.removePlacement(selectedPlacedEntity);
            }
          }}
        >
          DELETE SELECTED OBJECT
        </button>
      </div>

      <div>
        Features:
        <p />- Drag and drop any arbitrary combination from RHS menu onto canvas
        <p />- Change colors for next mesh dropped onto canvas
        <p />- RHS can have any number of arbitrary mesh objects
        <p />- Export current scene to GLTF
        <p />- Import arbitrary GLTF as RHS source object (teapot is gltf as
        demo)
        <p />- Orbit RHS object on hover
        <p />- Automatically orient object to align with base normal
        <p />- Outline object when a draggable object is hovered, turn cyan when
        "Selected". To select, click quickly on an object without moving the
        mouse (currently no drag radius so a single pixel movement will drag
        instead of selecting, will add when finished w state machine setup)
        <p />- Selected objects can be deleted using the big delete button or
        recolored by choosing a new color on the LHS while the object you want
        to recolor is selected (currently no indication the color has changed
        until object is deselected, as I'm currently overloading object color
        for state info - THREE's default outlines are very biased towards high
        luminence values & tend to be hard to distinguish. Just proof of
        concept, the indicator for selected status can be anything)
      </div>
      <p />
      <div>
        Future plans for improvement:
        <p />
        - fix bug where can drag object when is hidden (would need custom
        raycaster, not too hard)
        <p />
        - fix bug where initial drag can start to move camera (consequence of
        not wanting to set up a whole state machine system yet & effectively
        trying to emulate that with a complex series of state hooks - once I do
        that then this is fairly trivial to fix)
        <p />
        - fix any bugs to do with mouse up not exiting drag mode (also trivial
        once I get state machine up)
        <p />
        - DRACO compression/decompression for GLTFs
        <p />- Camera controls Gimbal Lock (less easy, needs to investigate
        intuitive quaternion-based camera controls - not 100% necessary but
        nice)
        <p />- No control gizmos for reorienting placed objects (functionally
        easy, deciding on how gizmo should look is harder - also it depends on
        if it's desired to keep the same normal direction as the given face on
        our base mesh or not - if normals should be kept aligned then only 1
        rotational DoF)
        <p />- Can only add on to base mesh (unclear if adding onto whole mesh
        is within desired scope, slightly challenging not impossible - begs the
        question of what to do w a mesh if the mesh it's 'pasted' onto is
        removed - spore seems to remove anything that's a "child" of that
        object)
        <p /> Each mesh currently solid color, can make mesh have
        texture/multiple color slots
        <p /> Animated Components
        <p /> Some sort of indication of what component you're dragging when not
        dragging over "canvas" (base sphere)
        <p /> Make code cleaner - just aiming for functional demo instead of
        PR-worthy code. Think this pattern is a great basis for further
        extensibility tho
        <p /> "Snap Points" (not-insignificant lift, state machine would be huge
        help here - would also require spec of what points to snap to in the
        first place)
        <p /> Components Categories
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
            <DraggableScene
              geometry={geometry}
              activeColor={activeColor}
              // dragging={dragging !== null}
            />
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
  useFrame(({ invalidate }, delta) => {
    if (hovering) {
      const angle = delta * 7;
      objRef.current!.rotateX(angle / 3);
      objRef.current!.rotateY(angle / 5);
      objRef.current!.rotateZ(angle / 7);
      invalidate();
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
