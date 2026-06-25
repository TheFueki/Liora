package groups

import (
	"errors"
	"fmt"
	"strconv"
)

func (s *Service) AddMemberToGroup(groupIDStr string, userID string) error {
	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		return fmt.Errorf("invalid group id format: %v", err)
	}

	if len(userID) == 0 {
		return errors.New("user id cannot be empty")
	}

	return s.repo.AddMember(groupID, userID, "member")
}

func (s *Service) LeaveGroup(groupIDStr string, userID string) error {
	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		return fmt.Errorf("invalid group id format: %v", err)
	}

	return s.repo.RemoveMember(groupID, userID)
}
