package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model;

import java.io.Serializable;

public class Student implements Serializable {
    private int studentId;
    private String studentName;
    private String email;
    private String department;
    private int yearOfStudy;

    public Student() {}

    public Student(int studentId, String studentName, String email, String department, int yearOfStudy) {
        this.studentId = studentId;
        this.studentName = studentName;
        this.email = email;
        this.department = department;
        this.yearOfStudy = yearOfStudy;
    }

    public Student(String studentName, String email, String department, int yearOfStudy) {
        this.studentName = studentName;
        this.email = email;
        this.department = department;
        this.yearOfStudy = yearOfStudy;
    }

    public int getStudentId() {
        return studentId;
    }

    public void setStudentId(int studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public int getYearOfStudy() {
        return yearOfStudy;
    }

    public void setYearOfStudy(int yearOfStudy) {
        this.yearOfStudy = yearOfStudy;
    }

    @Override
    public String toString() {
        return "Student{" +
                "studentId=" + studentId +
                ", studentName='" + studentName + '\'' +
                ", email='" + email + '\'' +
                ", department='" + department + '\'' +
                ", yearOfStudy=" + yearOfStudy +
                '}';
    }
}
