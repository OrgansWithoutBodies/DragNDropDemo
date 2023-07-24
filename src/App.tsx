import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import React, { createRef, forwardRef, useState } from "react";
import { Mesh, Object3D, Quaternion, SphereGeometry, Vector3 } from "three";
import "./App.css";
import { dataService } from "./data/data.service";
import { DraggableGeometry, ObjV3, PlacedID } from "./data/data.store";
import { useData } from "./data/useAkita";
type ForwardRefTypeOf<T, P = {}> = typeof forwardRef<T, P>;
function BoxImpl(
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

      <meshStandardMaterial color={"green"} />
    </mesh>
  );
}
const Box = React.forwardRef(BoxImpl);
function DraggableElement({
  color,
  onDragStart,
  geometry: implicitGeometry,
}: Draggable & DraggableGeometry) {
  const geometry = implicitGeometry();
  const { scene } = useThree();
  console.log("TEST123-scene", scene.children);
  return (
    <mesh onPointerDown={onDragStart}>
      <primitive attach="geometry" object={geometry} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
type Draggable = {
  color: string;
  onDragStart: () => void;
};

function App() {
  const [dragging, setDragging] = useState<PlacedID | null>(null);
  const cameraRef = createRef();
  const canvasContainerRef = createRef<HTMLDivElement>();
  const boxRef = createRef<Object3D<Event>>();

  const [{ droppableEntities, placedEntities }] = useData([
    "droppableEntities",
    "placedEntities",
  ]);
  console.log("TEST123-placed", placedEntities);
  const DraggableAdapter =
    ({ key }: { key: keyof typeof droppableEntities }) =>
    ({ color, onDragStart }: Draggable) =>
      (
        <DraggableElement
          color={color}
          onDragStart={onDragStart}
          geometry={droppableEntities[key].geometry}
        />
      );
  const items: {
    name: string;
    pic: string;
    color: string;
    id: keyof typeof droppableEntities;
  }[] = [
    {
      name: "test",
      pic: "https://render.fineartamerica.com/images/rendered/default/print/8/8/break/images/artworkimages/medium/2/basketball-skodonnell.jpg",
      color: "orange",
      id: "sphere",
    },
    {
      name: "test",
      pic: "https://media.istockphoto.com/id/839499742/photo/blue-pyramid-on-white-background-3d-rendering-illustration.jpg?s=612x612&w=0&k=20&c=9I7mfUakL_A2-jZySoc172zy8yIFp1-eVPtxeR4UVwA=",
      color: "blue",
      id: "cone",
    },
    {
      name: "test",
      pic: "https://m.media-amazon.com/images/I/41a5lZAc0XL._AC_UF350,350_QL80_.jpg",
      color: "yellow",
      id: "cone",
    },
  ];
  return (
    <div
      onMouseUp={() => setDragging(null)}
      style={{
        display: "flex",
        flexDirection: "row",
        cursor: dragging !== null ? "grab" : "initial",
      }}
    >
      <div style={{ width: 400, height: 400 }} ref={canvasContainerRef}>
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
          //     // console.log(pointerPos, intersects);
          //     if (intersects.length > 0) {
          //       console.log("HIT!");
          //     }
          //   }
          // }}
          // onMouseUp={() => console.log("test123")}
          color="black"
        >
          <perspectiveCamera ref={cameraRef} />

          <ambientLight />
          <directionalLight
            color="#ffffff"
            intensity={2}
            position={[-1, 2, 4]}
          />
          <Box
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
                console.log("TEST123-draggable", pos, normal);
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
        </Canvas>
      </div>
      <div>
        {items.map((item, ii) => {
          return (
            <div
              onMouseDown={() => {
                const placementID = dataService.addDroppable(item.id);
                setDragging(placementID);
                // console.log("SETDRAG", ii, dragging);
              }}
            >
              {/* <scene>
                <mesh>
                  <bufferGeometry
                </mesh>
                {item.component}
              </scene> */}
              <img
                width={100}
                src={item.pic}
                draggable={false}
                style={{ userSelect: "none" }}
              ></img>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
