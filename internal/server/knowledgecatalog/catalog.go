// Package knowledgecatalog validates local atomic knowledge independently of vector search.
package knowledgecatalog

import (
	"bufio"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

type Entry struct {
	ID, Title, SourceURL, SourceVersion, ReviewedAt, ReviewStatus string
	Metadata map[string]string
}

func Root() string {
	candidates := []string{filepath.Join("docs", "knowledge")}
	if _, source, _, ok := runtime.Caller(0); ok {
		candidates = append(candidates, filepath.Join(filepath.Dir(source), "..", "..", "..", "docs", "knowledge"))
	}
	for _, candidate := range candidates { if info, err := os.Stat(candidate); err == nil && info.IsDir() { absolute, _ := filepath.Abs(candidate); return absolute } }
	return ""
}

func Load() (map[string]Entry, error) {
	entries := map[string]Entry{}; root := Root()
	err := filepath.WalkDir(root, func(path string, item os.DirEntry, err error) error {
		if err != nil || item.IsDir() || !strings.HasSuffix(strings.ToLower(path), ".md") { return err }
		file, err := os.Open(path); if err != nil { return err }; defer file.Close()
		var current *Entry; scanner := bufio.NewScanner(file); scanner.Buffer(make([]byte, 4096), 1024*1024)
		for scanner.Scan() { line := strings.TrimSpace(scanner.Text()); if strings.HasPrefix(line, "# ") { title := strings.TrimSpace(strings.TrimPrefix(line, "# ")); fields := strings.Fields(title); if len(fields)>0 { value:=Entry{ID:fields[0],Title:title,Metadata:map[string]string{}}; current=&value; entries[value.ID]=value }; continue }; if current==nil { continue }; if strings.HasPrefix(line,"- ") { parts:=strings.SplitN(strings.TrimPrefix(line,"- "),":",2); if len(parts)==2 { current.Metadata[strings.TrimSpace(parts[0])]=strings.TrimSpace(parts[1]) } }; if strings.HasPrefix(line,"来源：") { if index:=strings.Index(line,"https://"); index>=0 { current.SourceURL=strings.TrimSpace(line[index:]) } }; current.SourceVersion=current.Metadata["source_version"];current.ReviewedAt=current.Metadata["reviewed_at"];current.ReviewStatus=current.Metadata["review_status"];entries[current.ID]=*current }
		return scanner.Err()
	})
	return entries, err
}
