package channels

import (
	"errors"
	"fmt"
	"strconv"
)

func (s *Service) SendPost(req SendPostRequest) (*ChannelPost, error) {
	if len(req.Content) == 0 {
		return nil, errors.New("post content cannot be empty")
	}

	chanID, err := strconv.Atoi(req.ChannelID)
	if err != nil {
		return nil, fmt.Errorf("invalid channel id format: %v", err)
	}

	post := &ChannelPost{
		ChannelID:   chanID,
		SenderID:    req.SenderID,
		RecipientID: req.ChannelID,
		Content:     req.Content,
	}

	id, err := s.repo.SavePost(post)
	if err != nil {
		return nil, err
	}

	post.ID = id
	return post, nil
}

func (s *Service) GetChannelHistory(channelIDStr string) ([]ChannelPost, error) {
	chanID, err := strconv.Atoi(channelIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid channel id format: %v", err)
	}

	return s.repo.GetPostsByChannelId(chanID)
}
