import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import React, { createRef, forwardRef, useState } from "react";
import { Mesh, Object3D, Quaternion, SphereGeometry, Vector3 } from "three";
import "./App.css";
import { DraggableGeometry } from "./data/data.store";
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
  const { scene } = useThree();
  console.log("TEST123-sphere", scene);
  return (
    <mesh
      name={"BASE"}
      ref={ref}
      onPointerMove={(event) => {
        if (dragging) {
          // console.log(event.intersections);
          onDragMove(
            event.intersections[0].point,
            event.intersections[0].face!.normal
          );
        }
      }}
    >
      <primitive attach="geometry" object={new SphereGeometry(1)} />
      {/* <bufferGeometry attach={"geometry"}>
        <bufferAttribute
          attach={"position"}
          itemSize={3}
          array={new SphereGeometry(1).attributes["position"].array}
          count={new SphereGeometry(1).attributes["position"].array.length}
        />
        <bufferAttribute
          attach={"normal"}
          itemSize={3}
          array={new SphereGeometry(1).attributes["normal"].array}
          count={new SphereGeometry(1).attributes["normal"].array.length}
        />
      </bufferGeometry> */}

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
  console.log("TEST123-geom", geometry);
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

function Cone({ color, onDragStart }: Draggable) {
  return (
    <mesh onPointerDown={onDragStart}>
      <coneGeometry args={[0.25, 0.5]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
interface ObjV3<T extends number = number> {
  x: T;
  y: T;
  z: T;
}

function App() {
  const [dragging, setDragging] = useState<number | null>(null);
  const cameraRef = createRef();
  const canvasContainerRef = createRef<HTMLDivElement>();
  const boxRef = createRef<Object3D<Event>>();

  const [{ droppableEntities }] = useData(["droppableEntities"]);
  const [ballPositions, setBallPositions] = useState<
    Record<number, { pos: ObjV3; normal: ObjV3; color: string } | null>
  >({ 0: null, 1: null, 2: null });
  console.log("TEST123-balls", ballPositions);
  const items: {
    name: string;
    pic: string;
    color: string;
    component: (args: Draggable) => JSX.Element;
  }[] = [
    {
      name: "test",
      pic: "https://render.fineartamerica.com/images/rendered/default/print/8/8/break/images/artworkimages/medium/2/basketball-skodonnell.jpg",
      color: "orange",
      component: ({ color, onDragStart }) => (
        <DraggableElement
          color={color}
          onDragStart={onDragStart}
          geometry={droppableEntities["sphere"].geometry}
        />
      ),
    },
    {
      name: "test",
      pic: "https://media.istockphoto.com/id/839499742/photo/blue-pyramid-on-white-background-3d-rendering-illustration.jpg?s=612x612&w=0&k=20&c=9I7mfUakL_A2-jZySoc172zy8yIFp1-eVPtxeR4UVwA=",
      color: "blue",
      component: Cone,
    },
    {
      name: "test",
      pic: "https://m.media-amazon.com/images/I/41a5lZAc0XL._AC_UF350,350_QL80_.jpg",
      color: "yellow",
      component: ({ color, onDragStart }) => (
        <DraggableElement
          color={color}
          onDragStart={onDragStart}
          geometry={droppableEntities["sphere"].geometry}
        />
      ),
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
              // console.log("ondrag", ballPositions);
              const mutableBallPositions = { ...ballPositions };
              mutableBallPositions[dragging!] = {
                pos,
                normal,
                color: items[dragging!].color,
              };

              setBallPositions(mutableBallPositions);
            }}
          />
          {Object.values(ballPositions).map((args, ii) => {
            if (args !== null) {
              const { color, pos, normal } = args;
              const Draggable = items[ii].component;
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
                    onDragStart={() => setDragging(ii)}
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
                setDragging(ii);
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
