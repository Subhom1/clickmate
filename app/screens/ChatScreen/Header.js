import React from 'react'
import {
    View,
    TouchableOpacity,
    StyleSheet,
} from 'react-native'
import Icon  from "react-native-vector-icons/MaterialIcons";

const Header = ({
    leftBtnAction,
}) => {
    
        return (
          <View style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.leftButton}
                onPress={leftBtnAction}
              >
                <Icon name='arrow-back-ios-new' size={25}/>
              </TouchableOpacity>
            </View>
          </View>
        );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 30,
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  leftButton: {
    flex: 1,
    alignItems: "flex-start",
  },
});

export default Header