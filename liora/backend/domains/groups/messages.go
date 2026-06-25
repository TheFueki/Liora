package groups

import (
	"errors"
	"fmt"
	"strconv"
)

func (s *Service) SendMessage(req SendMessageRequest) (*GroupMessage, error) {
	if len(req.Content) == 0 {
		return nil, errors.New("message content cannot be empty")
	}

	groupID, err := strconv.Atoi(req.GroupID)
	if err != nil {
		return nil, fmt.Errorf("invalid group id format: %v", err)
	}

	msg := &GroupMessage{
		GroupID:  groupID,
		SenderID: req.SenderID,
		Content:  req.Content,
	}

	id, err := s.repo.SaveMessage(msg)
	if err != nil {
		return nil, err
	}

	msg.ID = id
	return msg, nil
}

func (s *Service) GetGroupHistory(groupIDStr string) ([]GroupMessage, error) {
	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid group id format: %v", err)
	}

	return s.repo.GetMessagesByGroupId(groupID)
}
