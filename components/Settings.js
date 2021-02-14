import { AppBar, Tabs, Tab } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import { useState, useEffect, useRef } from "react";
import { Input, Button } from "components";
import axios from "axios";
import { LoaderIndicator } from "./Spinner";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

export const Settings = ({ roomId }) => {
  const a11yProps = (index) => {
    return {
      id: `simple-tab-${index}`,
      "aria-controls": `simple-tabpanel-${index}`,
    };
  };
  const [value, setValue] = useState(0);
  const [roomInfo, setRoomInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const passwordConfirmRef = useRef(null);
  const checkRoom = async () => {
    const roomInfo = await axios.get(`/room_check/${roomId}`);
    return setRoomInfo(roomInfo.data);
  };

  useEffect(() => {
    checkRoom();
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const savePassword = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post("/set_password", {
        roomID: roomId,
        password: password,
      });

      setPassword("");
      checkRoom();
    } catch (e) {
      console.warn(e);
    }
    setLoading(false);
  };

  const changePassword = () => {};

  return (
    <>
      <AppBar position="static">
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="simple tabs example"
        >
          <Tab label="Room Password" {...a11yProps(0)} />
          <Tab label="Gloabl Audio Settings" {...a11yProps(1)} />
          <Tab label="Global Video Settings" {...a11yProps(2)} />
        </Tabs>
      </AppBar>
      <TabPanel value={value} index={0}>
        Password Protected: {roomInfo?.isLocked ? "true" : `false`}
        <br />
        <div className={`password-field`}>
          {roomInfo?.isLocked ? (
            <div className={`change-password-input-wrapper`}>
              <Input
                value={password}
                type={`password`}
                onChange={({ target }) => setPassword(target.value)}
                ref={inputRef}
                placeholder={`password`}
              ></Input>
              <Input
                value={passwordConfirm}
                type={`password`}
                onChange={({ target }) => setPasswordConfirm(target.value)}
                ref={passwordConfirmRef}
                placeholder={`confirm password`}
              ></Input>
              <Button variant={`outlined`} onClick={changePassword}>
                {" "}
                Change Password{" "}
              </Button>
            </div>
          ) : (
            <>
              {loading ? (
                <LoaderIndicator />
              ) : (
                <>
                  <Input
                    value={password}
                    type={`password`}
                    onChange={({ target }) => setPassword(target.value)}
                    ref={inputRef}
                  ></Input>
                  <Button variant={`outlined`} onClick={savePassword}>
                    {" "}
                    Set Password{" "}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </TabPanel>
      <TabPanel value={value} index={1}>
        Disable Audio for All
      </TabPanel>
      <TabPanel value={value} index={2}>
        Disable Video for All
      </TabPanel>
    </>
  );
};
