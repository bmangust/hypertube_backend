package torrent

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"

	"hypertube_storage/model"

	"github.com/sirupsen/logrus"
)

func ParseTrackerReps(peersBin []byte) ([]model.Peer, error) {
	const peerSize = 6 // 4 for IP, 2 for port
	numPeers := len(peersBin) / peerSize
	if len(peersBin)%peerSize != 0 {
		err := fmt.Errorf("received malformed peers")
		return nil, err
	}
	peers := make([]model.Peer, numPeers)
	for i := 0; i < numPeers; i++ {
		offset := i * peerSize
		peers[i].IP = peersBin[offset : offset+4]
		peers[i].Port = binary.BigEndian.Uint16(peersBin[offset+4 : offset+6])
	}
	return peers, nil
}

func ReadHandshake(r io.Reader) (*model.Handshake, bool) {
	container := model.Handshake{}
	requestData, err := ioutil.ReadAll(r)
	if err != nil {
		logrus.Error("Can't read request body: ", err)
		return nil, false
	}
	err = json.Unmarshal(requestData, &container)
	if err != nil {
		logrus.Error("Can't read request body: ", err)
		return nil, false
	}
	return &container, true
}

func ReadMessage(r io.Reader) (*model.Message, bool) {
	lengthBuf := make([]byte, 4)
	_, err := io.ReadFull(r, lengthBuf)
	if err != nil {
		return nil, false
	}
	length := binary.BigEndian.Uint32(lengthBuf)

	if length == 0 {
		return nil, false
	}

	messageBuf := make([]byte, length)
	_, err = io.ReadFull(r, messageBuf)
	if err != nil {
		return nil, false
	}

	m := model.Message{
		ID:      model.MessageID(messageBuf[0]),
		Payload: messageBuf[1:],
	}

	return &m, true
}
