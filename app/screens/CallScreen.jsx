// import React, { useEffect, useState } from "react";
// import { View, Button, Text, TouchableOpacity } from "react-native";
// // import Daily from "@daily-co/react-native-daily-js";

// const CallScreen = ({ roomUrl }) => {
//   const [callObject, setCallObject] = useState(null);
//   const [callState, setCallState] = useState("idle");

//   useEffect(() => {
//     // Create a Daily call object and join the room
//     const call = DailyIframe.createCallObject();
//     setCallObject(call);

//     call.on("joined-meeting", () => {
//       setCallState("joined");
//     });

//     call.on("left-meeting", () => {
//       setCallState("left");
//     });

//     return () => {
//       call.destroy();
//     };
//   }, []);

//   const startCall = () => {
//     callObject.join({ url: roomUrl });
//   };

//   const leaveCall = () => {
//     callObject.leave();
//     setCallState("left");
//   };

//   return (
//     <View>
//       <Text>Status: {callState}</Text>
//       {callState === "joined" && (
//         <TouchableOpacity className=" bg-primary_blue rounded-3xl w-20 py-3 self-center">
//           <Text className="text-white text-center">End</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// };

// export default CallScreen;
