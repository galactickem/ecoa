using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Networking;
using System.IO;
using SimpleJSON;
using UnityEngine.SceneManagement;

public class MenuDBManager : MonoBehaviour
{
    public GameObject userObject;
    public string JSONurl = "";
    public string studentID;
    public Image statusMaterias;
    public Image statusProfesores;
    public int answeredM;
    public int amountM;
    public int answeredP;
    public int amountP;
    public Sprite completed;
    public Sprite inProgress;
    public Sprite uncompleted;
    public Sprite invalid;
    public Image endImage;
    public Sprite endBlocked;
    public Sprite endUnblocked;
    public Button endButton;


    IEnumerator Start()
    {
        studentID = userObject.GetComponent<User>().ID;

        JSONurl = "http://localhost:8080/api/progress/student/" + studentID;
        UnityWebRequest web = UnityWebRequest.Get(JSONurl);
        web.useHttpContinue = false;

        yield return web.SendWebRequest();

        if (web.isNetworkError || web.isHttpError)
        {
            Debug.Log("Error API: " + web.error);
            SceneManager.LoadScene("Error");
        }
        else
        {
            Debug.Log(web.downloadHandler.text);
            JSONNode jsonReceived = SimpleJSON.JSON.Parse(web.downloadHandler.text);
            Debug.Log(jsonReceived["FORMATION_UNITS"].ToString());
            amountM = jsonReceived["FORMATION_UNITS"]["totalQuestionAmount"];
            answeredM = jsonReceived["FORMATION_UNITS"]["totalQuestionsAnswered"];
            Debug.Log(jsonReceived["TEACHERS"].ToString());
            amountP = jsonReceived["TEACHERS"]["totalQuestionAmount"];
            answeredP = jsonReceived["TEACHERS"]["totalQuestionsAnswered"];
        }

        updateStatusM();
        updateStatusP();

        if (answeredM == amountM && answeredP == amountP){
            endImage.sprite = endUnblocked;
            endButton.onClick.AddListener(moveToEnd);
        } else
        {
            endImage.sprite = endBlocked;
        }

    }

    void updateStatusM()
    {
        if (answeredM == 0)
        { statusMaterias.sprite = uncompleted; }
        else if (answeredM < amountM)
        { statusMaterias.sprite = inProgress; }
        else if (answeredM == amountM)
        { statusMaterias.sprite = completed; }
        else
        { statusMaterias.sprite = invalid; }
    }

    void updateStatusP()
    {
        if (answeredP == 0)
        { statusProfesores.sprite = uncompleted; }
        else if (answeredP < amountP)
        { statusProfesores.sprite = inProgress; }
        else if (answeredP == amountP)
        { statusProfesores.sprite = completed; }
        else
        { statusProfesores.sprite = invalid; }
    }

    void moveToEnd() 
    {
        SceneManager.LoadScene("final");
    }

}

