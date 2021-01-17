import {
  Card,
  Grid,
  IconButton,
  makeStyles,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import Input from "components/Input";
import { useEffect, useRef, useState } from "react";

const useStyles = makeStyles((theme) => ({
  outerContainer: { padding: theme.spacing(3) },
  gridItemInput: { flexGrow: 1 },
  copyButton: { padding: theme.spacing(0.5) },
}));

export const Alone = () => {
  const classes = useStyles();
  const [copySuccess, setCopySuccess] = useState(false);
  const [roomLink, setRoomLink] = useState("");
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
    setCopySuccess(true);
  };

  useEffect(() => {
    if (copySuccess) {
      setTimeout(() => {
        setCopySuccess(false);
      }, 1000);
    }
  }, [copySuccess]);

  return (
    <Card raised className={classes.outerContainer}>
      <Typography variant="h2" color="inherit" display={`block`}>
        You're All Alone 😞
      </Typography>
      <Typography variant="h2" color="inherit" display={`block`}>
        Why not invite some friends?
      </Typography>
      <Grid
        container
        direction="row"
        spacing={3}
        justify="center"
        alignItems="center"
      >
        <Grid item className={classes.gridItemInput}>
          <Input
            myRef={(ref) => (myInput = ref)}
            disabled
            value={roomLink}
            fullWidth={true}
          />
        </Grid>
        <Grid item>
          <Tooltip
            title="Link Copied"
            arrow
            open={copySuccess}
            disableFocusListener={true}
            disableHoverListener={true}
            disableTouchListener={true}
            placement="top"
          >
            <IconButton onClick={copyLink}>
              <FontAwesomeIcon
                className={classes.copyButton}
                icon={faCopy}
                size="2x"
              ></FontAwesomeIcon>
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>
    </Card>
  );
};
