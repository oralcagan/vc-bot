package slash

import "fmt"

type GuildMember struct {
	User User `json:"user"`
}

type User struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Bot      bool   `json:"bot"`
}

type InteractionDataOption struct {
	Name    string                  `json:"name"`
	Value   string                  `json:"value"`
	Options []InteractionDataOption `json:"options"`
}

type InteractionData struct {
	ID      string                  `json:"id"`
	Name    string                  `json:"name"`
	Options []InteractionDataOption `json:"options"`
}

type Interaction struct {
	ID        string          `json:"id"`
	Type      int             `json:"type"`
	Data      InteractionData `json:"data"`
	GuildID   string          `json:"guild_id"`
	ChannelID string          `json:"channel_id"`
	Member    GuildMember     `json:"member"`
	User      User            `json:"user"`
	Token     string          `json:"token"`
	Version   int             `json:"version"`
}

type InteractionResponse struct {
	Type int                            `json:"type"`
	Data InteractionCommandCallbackData `json:"data"`
}

type InteractionResponseType struct {
	Pong                             int
	ChannelMessageWithSource         int
	DeferredChannelMessageWithSource int
}

type InteractionCommandCallbackData struct {
	Content string `json:"content"`
}

type NoUIDError struct{}
type QueryDocError struct {
	docslen int
}

func (e *NoUIDError) Error() string {
	return "Couldn't find UID"
}

func (e *QueryDocError) Error() string {
	return fmt.Sprintf("%d Documents",e.docslen)
}