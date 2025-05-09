import {
  Container,
  Stack,
  Button,
  Snackbar,
  Typography,
  Divider,
  useMediaQuery,
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
import { useFormik } from "formik";
import * as yup from "yup";
import Preview from "../components/Preview";
import FormFields from "../components/FormFields";
import broadClinicalReviewFields from "../lib/forms/broadClinicalReview";
import { createEncounter, FhirApi } from "../lib/api";

export default function BroadClinicalReview() {
  let navigate = useNavigate();
  let [open, setOpen] = useState(false);

  let [visit, setVisit] = useState();
  let [message, setMessage] = useState(false);
  let isMobile = useMediaQuery("(max-width:600px)");

  const [value, setValue] = useState("1");

  const [inputData, setInputData] = useState({});
  const [preview, setPreview] = useState(false);

  const fieldValues = Object.values(broadClinicalReviewFields).flat();
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
    ...fieldValues.map((item) => ({
      [item.name]: item.type === "checkbox" ? [] : "",
    }))
  );

  const formik = useFormik({
    initialValues: {
      ...initialValues,
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      console.log(values);
      setPreview(true);
      setInputData(values);
    },
  });

  const prompt=(text)=>{

    setMessage(text);
    setOpen(true);

    setTimeout(() => {
      setOpen(false);
    }, 4000);

    return;
  }

  let saveBroadClinicalReview = async (values) => {
    let patient = visit.id;
    if (!patient) {
      prompt(
        "No patient visit not been initiated. To start a visit, Select a client from the Client list"
      );
      return;
    }

    let encounter = await createEncounter(patient, "BROAD_CLINICAL_REVIEW");

    let res = await (
      await FhirApi({
        url: `/crud/observations`,
        method: "POST",
        data: JSON.stringify({
          patientId: patient,
          encounterId: encounter.id,
          observations: values,
        })
      })
    ).data;

    if (res.status === "success") {
      prompt("Broad Clinical Review saved successfully");
      navigate(`/patients/${patient}`);
      return;
    } else {
      prompt(res.error);
      return;
    }
  };

  const handleChange = (newValue) => {
    setValue(newValue);
  };
  
  useEffect(() => {
    let visit = window.localStorage.getItem("currentPatient");
    if (!visit) {
      return;
    }
    setVisit(JSON.parse(visit));
    return;
  }, []);

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
              title="Broad Clinical Review Preview"
              format={broadClinicalReviewFields}
              data={{ ...inputData }}
              close={() => setPreview(false)}
              submit={saveBroadClinicalReview}
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
                  >
                    <Tab label="Broad clinical review at first contact below 6 months" value="1" />
                  </TabList>
                </Box>

                <TabPanel value="1">
                  <FormFields formData={broadClinicalReviewFields} formik={formik} />
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
                </TabPanel>
              </TabContext>
            </form>
          )}
        </Container>
      </LocalizationProvider>
    </>
  );
}
