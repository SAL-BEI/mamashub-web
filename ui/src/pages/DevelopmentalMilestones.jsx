import {
  Container,
  Stack,
  Button,
  Grid,
  Snackbar,
  Typography,
  Divider,
  useMediaQuery,
  CircularProgress,
  Modal,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Box } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import CurrentPatient from "../components/CurrentPatient";
import { apiHost, createEncounter, FhirApi } from "../lib/api";
import { useFormik } from "formik";
import * as yup from "yup";
import Preview from "../components/Preview";
import FormFields from "../components/FormFields";
import developmentalMilestonesFields from "../lib/forms/developmentalMilestones";
import { getSections } from "../lib/getFormSections";

export default function DevelopmentalMilestones() {
  let [visit, setVisit] = useState();
  let navigate = useNavigate();
  let [open, setOpen] = useState(false);
  let [loading, setLoading] = useState(false);
  let [message, setMessage] = useState(false);
  let [observations, setObservations] = useState([]);
  let isMobile = useMediaQuery("(max-width:600px)");
  const [newVisit, setNewVisit] = useState(false);
  let [developmentalMilestonesEncounters, setDevelopmentalMilestonesEncounters] = useState(
    []
  );
  const handleClose = () => setOpenModal(false);
  const handleOpen = () => setOpenModal(true);
  const [value, setValue] = useState("1");
  let [openModal, setOpenModal] = useState(false);

  const [inputData, setInputData] = useState({});
  const [preview, setPreview] = useState(false);

  const fieldValues = Object.values(getSections(developmentalMilestonesFields, developmentalMilestonesEncounters.length, developmentalMilestonesEncounters.length+1)).flat();
  const validationFields = fieldValues
    .filter((item) => item.validate)
    .map((item) => ({
      [item.name]: item.validate,
    }));

  const validationSchema = yup.object({
    ...Object.assign({}, ...validationFields),
  });

  const initialValues = Object.assign(
    {},
    ...fieldValues.map((item) => ({ [item.name]: "" }))
  );

  const formik = useFormik({
    initialValues: {
      ...initialValues,
    },
    validationSchema: validationSchema,
    // submit form
    onSubmit: (values) => {
      console.log(values);
      setPreview(true);
      setInputData(values);
    },
  });

  function prompt(text) {
    setMessage(text);
    setOpen(true);
    setTimeout(() => {
      setOpen(false);
    }, 4000);
    return;
  }

  const handleChange = (newValue) => {
    setValue(newValue);
  };

  useEffect(() => {
    let visit = window.localStorage.getItem("currentPatient");
    if (!visit) {
      setMessage(
        "No patient visit not been initiated. To start a visit, Select a patient in the Patients list"
      );
      setOpen(true);
      setTimeout(() => {
        setOpen(false);
      }, 4000);
      return;
    }
    setVisit(JSON.parse(visit));
    return;
  }, []);

  useEffect(() => {
    let visit = window.localStorage.getItem("currentPatient");
    if (!visit) {
      prompt(
        "No patient visit not been initiated. To start a visit, Select a patient in the Patients list"
      );
      return;
    }
    setVisit(JSON.parse(visit));
    return;
  }, []);

  useEffect(() => {
    let visit = window.localStorage.getItem("currentPatient") ?? null;
    visit = JSON.parse(visit) ?? null;
    if (visit) {
      getDevelopmentalMilestonesEncounters(visit.id);
    }
  }, []);

  let getEncounterObservations = async (encounter) => {
    setObservations([]);
    handleOpen();
    console.log(encounter);
    let observations = await (
      await FhirApi({
        url: `/crud/observations?encounter=${encounter}`,
      })
    ).data;
    setObservations(observations.observations);
    return;
  };

  let getDevelopmentalMilestonesEncounters = async (patientId) => {
    setLoading(true);
    let encounters = await (
      await FhirApi({
        url: `/crud/encounters?patient=${patientId}&encounterCode=${"DEVELOPMENTAL_MILESTONES"}`,
      })
    ).data;
    console.log(encounters);
    setDevelopmentalMilestonesEncounters(encounters.encounters);
    setLoading(false);
    return;
  };
  let saveDevelopmentalMilestones = async (values) => {
    if (!visit) {
      prompt(
        "No patient visit not been initiated. To start a visit, Select a patient in the Patient's list"
      );
      return;
    }
    let patient = visit.id;
    try {
      //create Encounter
      let encounter = await createEncounter(patient, "DEVELOPMENTAL_MILESTONES");
      
      //Create and Post Observations
      let res = await (
        await fetch(`${apiHost}/crud/observations`, {
          method: "POST",
          body: JSON.stringify({
            patientId: patient,
            encounterId: encounter.id,
            observations: values,
          }),
          headers: { "Content-Type": "application/json" },
        })
      ).json();
      console.log(res);

      if (res.status === "success") {
        prompt("Developmental Miestones saved successfully");
        navigate(`/patients/${patient}`);
        await getDevelopmentalMilestonesEncounters(patient);
        setNewVisit(false);
        return;
      } else {
        prompt(res.error);
        return;
      }
    } catch (error) {
      console.error(error);
      prompt(JSON.stringify(error));
      return;
    }
  };
  const ordinalSuffix = (i) => {
    let j = i % 10,
      k = i % 100;
    if (j === 1 && k !== 11) {
      return i + "st";
    }
    if (j === 2 && k !== 12) {
      return i + "nd";
    }
    if (j === 3 && k !== 13) {
      return i + "rd";
    }
    return i + "th";
  };
  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Container sx={{ border: "1px white dashed" }}>
          <Snackbar
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            open={open}
            message={message}
            key={"loginAlert"}
          />
          {visit && <CurrentPatient data={visit} />}
          {preview ? (
            <Preview
              title="Developmental Milestones Preview"
              format={getSections(developmentalMilestonesFields, developmentalMilestonesEncounters.length, developmentalMilestonesEncounters.length+1)}
              data={{ ...inputData }}
              close={() => setPreview(false)}
              submit={saveDevelopmentalMilestones}
            />
          ) : (
            <form onSubmit={formik.handleSubmit}>
              <TabContext value={value}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                  <TabList
                    value={value}
                    onChange={handleChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    aria-label="scrollable auto tabs example"
                  >
                    <Tab label="Developmental Milestones" value="1" />
                  </TabList>
                </Box>
                <TabPanel value="1">

                  
                  {!newVisit && (
                    
                  <Grid container spacing={1} padding=".5em">
                    {developmentalMilestonesEncounters.length > 0 &&
                      developmentalMilestonesEncounters.map((x, index) => {
                        return (
                          <Grid item xs={12} md={12} lg={3}>
                            <Button
                              variant="contained"
                              onClick={(e) => {
                                getEncounterObservations(x.resource.id);
                              }}
                              sx={{ backgroundColor: "#632165", width: "99%" }}
                            >
                              {`${ordinalSuffix(index + 1)} Visit`}
                            </Button>
                          </Grid>
                        );
                      })}
                       {developmentalMilestonesEncounters.length < 8 && (
                    <Grid
                        item
                        xs={12}
                        md={12}
                        lg={12}
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          marginTop: "2rem",
                        }}
                      >
                        
                        <Button
                          variant="contained"
                          onClick={(e) => {
                            setNewVisit(true);
                          }}
                          sx={{
                            backgroundColor: "#632165",
                          }}
                        >
                          Add a visit
                        </Button>
                      </Grid>
                    )}
                    
                  </Grid>)}
                  
                  {developmentalMilestonesEncounters.length < 1 && loading && (
                    <>
                      <CircularProgress />
                    </>
                  )}
                  <Divider />
                  {newVisit &&(
                    <>
                  <FormFields
                  formData={getSections(developmentalMilestonesFields, developmentalMilestonesEncounters.length, developmentalMilestonesEncounters.length+1)}
                  formik={formik}
                />
                  
                  <p></p>
                  <Divider />
                  <p></p>
                  <Stack direction="row" spacing={2} alignContent="right">
                    {!isMobile && (
                      <Typography sx={{ minWidth: "80%" }}></Typography>
                    )}
                    <Button
                      variant="contained"
                      disableElevation
                      sx={{ backgroundColor: "gray" }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      type="submit"
                      disableElevation
                      sx={{ backgroundColor: "#632165" }}
                    >
                      Save
                    </Button>
                  </Stack>
                  <p></p>
                  </>
                  )}
                </TabPanel>
              </TabContext>
            </form>
          )}
          
          <Modal
            keepMounted
            open={openModal}
            sx={{ overflow: "scroll" }}
            onClose={handleClose}
          >
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "90%",
                bgcolor: "background.paper",
                border: "2px solid #000",
                boxShadow: 24,
                p: 4,
              }}
            >
              <br />
              {((observations && observations.length < 1) || !observations) && (
                <>
                  <CircularProgress />
                  <Typography variant="h6">Loading</Typography>
                </>
              )}
              <Grid container columnSpacing={1}>
                {observations &&
                  observations.map((observation) => {
                    return (
                      <>
                        <Grid container>
                          {observation.resource.code.coding &&
                            observation.resource.code.coding.map((entry) => {
                              return (
                                <>
                                  <Grid item lg={6} xl={6} md={6} sm={6}>
                                    <Typography>{entry.display}</Typography>
                                  </Grid>
                                  <Grid item lg={6} xl={6} md={6} sm={6}>
                                    <Typography variant="p">
                                      {observation.resource.valueQuantity
                                        ? observation.resource.valueQuantity
                                            .value
                                        : observation.resource.valueString ??
                                          observation.resource.valueDateTime ??
                                          "-"}
                                    </Typography>
                                  </Grid>
                                </>
                              );
                            })}
                          <p></p>
                        </Grid>
                      </>
                    );
                  })}
              </Grid>
            </Box>
          </Modal>
        </Container>
      </LocalizationProvider>
    </>
  );
}
