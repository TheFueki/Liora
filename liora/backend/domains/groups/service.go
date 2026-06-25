package groups

import "errors"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) CreateGroup(req CreateGroupRequest) (*Group, error) {
	if len(req.Name) < 3 {
		return nil, errors.New("group name is too short (min 3 characters)")
	}

	newGroup := &Group{
		Name:        req.Name,
		Description: req.Description,
		CreatorID:   req.CreatorID,
	}

	id, err := s.repo.Create(newGroup)
	if err != nil {
		return nil, err
	}
	newGroup.ID = id

	err = s.repo.AddMember(id, req.CreatorID, "creator")
	if err != nil {
		return nil, err
	}

	for _, memberID := range req.Members {
		if memberID == req.CreatorID || len(memberID) == 0 {
			continue
		}
		_ = s.repo.AddMember(id, memberID, "member")
	}

	return newGroup, nil
}

func (s *Service) ListMyGroups(userID string) ([]Group, error) {
	if len(userID) == 0 {
		return nil, errors.New("user id cannot be empty")
	}
	return s.repo.GetUserGroups(userID)
}
