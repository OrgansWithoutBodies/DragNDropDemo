import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { createRef, forwardRef, useState } from "react";
import { Mesh, Object3D, Vector3 } from "three";
import "./App.css";
type ForwardRefTypeOf<T, P = {}> = typeof forwardRef<T, P>;
function BoxImpl(
  {
    dragging,
    onDragMove,
  }: {
    dragging: boolean;
    onDragMove: (event: { x: number; y: number; z: number }) => void;
  },
  ref: React.Ref<Mesh>
): JSX.Element {
  return (
    <mesh
      ref={ref}
      onPointerMove={(event) => {
        if (dragging) {
          onDragMove(event.intersections[0].point);
        }
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={"green"} />
    </mesh>
  );
}
const Box = React.forwardRef(BoxImpl);
function Sphere({
  color,
  onDragStart,
}: {
  color: string;
  onDragStart: () => void;
}) {
  return (
    <mesh onPointerDown={onDragStart}>
      <sphereGeometry args={[0.25]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function App() {
  const [dragging, setDragging] = useState<0 | 1 | null>(null);
  const cameraRef = createRef();
  const canvasContainerRef = createRef<HTMLDivElement>();
  const boxRef = createRef<Object3D<Event>>();
  const [ballPositions, setBallPositions] = useState<
    Record<
      0 | 1,
      {
        x: number;
        y: number;
        z: number;
        color: string;
      } | null
    >
  >({ 0: null, 1: null });
  const items: { name: string; pic: string; color: string }[] = [
    {
      name: "test",
      pic: "https://render.fineartamerica.com/images/rendered/default/print/8/8/break/images/artworkimages/medium/2/basketball-skodonnell.jpg",
      color: "orange",
    },
    {
      name: "test",
      pic: "https://m.media-amazon.com/images/I/41a5lZAc0XL._AC_UF350,350_QL80_.jpg",
      color: "yellow",
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
            onDragMove={(position) => {
              console.log("ondrag", ballPositions);
              const mutableBallPositions = { ...ballPositions };
              mutableBallPositions[dragging!] = {
                ...position,
                color: items[dragging!].color,
              };

              setBallPositions(mutableBallPositions);
            }}
          />
          {Object.values(ballPositions).map((args, ii) => {
            if (args !== null) {
              const { color, ...ballPosition } = args;
              return (
                <group
                  position={
                    new Vector3(ballPosition.x, ballPosition.y, ballPosition.z)
                  }
                >
                  <Sphere
                    color={color}
                    onDragStart={() => setDragging(ii as 0 | 1)}
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
                setDragging(ii as 0 | 1);
                // console.log("SETDRAG", ii, dragging);
              }}
            >
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
