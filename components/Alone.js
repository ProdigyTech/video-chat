import { Grid, makeStyles, Card, Typography } from "@material-ui/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import Input from "components/Input";
import { useState, useEffect, useRef } from "react";

const useStyles = makeStyles((theme) => ({
  main: {
    height: "50%",
  },
  sub: { padding: "11rem", flexGrow: 1 },
  input: { width: "90%" },
}));

export const Alone = () => {
  const classes = useStyles();
  const [copySuccess, setCopySuccess] = useState("");
  const [roomLink, setRoomLink] = useState(null);
  const inputRef = useRef(null);
  let myInput = null;
  useEffect(() => {
    setRoomLink(window.location.href);
  }, []);

  const copyLink = () => {
    const el = document.createElement("textarea");
    el.value = myInput.firstChild.children[0].value;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    document.execCommand("copy");
    setCopySuccess("Copied!");
  };

  return (
    <Grid
      container
      alignItems="center"
      justify="center"
      className={classes.main}
    >
      <Grid item>
        <Card raised className={classes.sub}>
          <Typography variant="h2" color="inherit" noWrap display={`block`}>
            You're All Alone 😞
          </Typography>
          <Typography variant="h2" color="inherit" noWrap display={`block`}>
            Why not invite some friends?
          </Typography>
          <>
            <Input
              myRef={(ref) => (myInput = ref)}
              disabled
              value={roomLink}
              className={classes.input}
            />
            <FontAwesomeIcon
              icon={faCopy}
              onClick={copyLink}
              className={`copy--icon`}
            ></FontAwesomeIcon>
            {copySuccess}
          </>
        </Card>
      </Grid>
    </Grid>
  );
};
