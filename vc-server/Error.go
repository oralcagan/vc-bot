package main

import "fmt"

type fetchPrefsError struct {
}

func (e *fetchPrefsError) Error() string {
	return fmt.Sprintf("Failed to fetch userprefs")
}

type unknownReqType struct {
	reqType RequestType
}

func (e *unknownReqType) Error() string {
	return fmt.Sprintf("Unknown request type %v", e.reqType)
}
