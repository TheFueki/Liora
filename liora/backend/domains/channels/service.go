package channels

import "errors"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) CreateChannel(req CreateChannelRequest) (*Channel, error) {
	if len(req.Name) < 3 {
		return nil, errors.New("Name is too short")
	}

	newChannel := &Channel{
		Name:        req.Name,
		Description: req.Description,
		OwnerID:     req.OwnerID,
		IsPrivate:   false,
	}

	id, err := s.repo.Create(newChannel)
	if err != nil {
		return nil, err
	}

	newChannel.ID = id
	return newChannel, nil
}
