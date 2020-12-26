import { Container } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => {
  return {
    root: {
      padding: theme.spacing(4),
    },
  };
});

export const Layout = ({ children }) => {
  const classes = useStyles();
  return (
    <Container className={classes.root} maxWidth="sm">
      {children}
    </Container>
  );
};
