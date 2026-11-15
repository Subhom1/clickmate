import React, { forwardRef } from "react";
import { ScrollView } from "react-native";

// Tapping empty space or dragging the form closes the keyboard; buttons still work on the first tap.
const KeyboardDismissScrollView = forwardRef(function KeyboardDismissScrollView(props, ref) {
  return (
    <ScrollView
      ref={ref}
      testID="keyboard-dismiss-scroll"
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      {...props}
    />
  );
});

export default KeyboardDismissScrollView;
